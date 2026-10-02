const express = require('express');
const Order = require('../models/order');
const MenuItem = require('../models/menuItem');
const Profile = require('../models/profile');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to escape regex special characters
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// All routes in this file are protected
router.use(protect);

// @desc    Get total order count for the logged-in user
// @route   GET /api/orders/count
router.get('/count', async (req, res) => {
    try {
        const count = await Order.countDocuments({ userId: req.user.id });
        res.json({ count });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all orders for the logged-in user with server-side handling
// @route   GET /api/orders
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const requestedLimit = parseInt(req.query.limit);
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'date';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const paymentFilter = req.query.paymentFilter;
        const filterType = req.query.filterType;

        const query = { userId: req.user.id };

        // Payment filtering
        if (paymentFilter && paymentFilter !== 'all') {
            query.paymentMethod = paymentFilter;
        }

        // Date filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (filterType === 'today') {
            query.date = { $gte: today, $lt: tomorrow };
        } else if (filterType === 'single' && req.query.singleDate) {
            const singleDate = new Date(req.query.singleDate);
            singleDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(singleDate);
            nextDay.setDate(singleDate.getDate() + 1);
            query.date = { $gte: singleDate, $lt: nextDay };
        } else if (filterType === 'range' && req.query.dateStart && req.query.dateEnd) {
            const startDate = new Date(req.query.dateStart);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(req.query.dateEnd);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        // Search filtering with escaped regex to prevent ReDoS
        if (search && typeof search === 'string' && search.trim() !== '') {
            const searchRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
            query.$or = [
                { 'customer.name': searchRegex },
                { 'customer.mobile': searchRegex }
            ];
        }
        
        // Special case for CSV export: cap at 1000 to prevent OOM
        if (requestedLimit === 0) {
            const exportOrders = await Order.find(query).sort({ [sortBy]: sortOrder }).limit(1000);
            return res.json({ data: exportOrders, total: exportOrders.length, totalPages: 1, page: 1 });
        }

        // Cap limit to a safe range (max 100)
        const limit = Math.min(100, Math.max(1, requestedLimit || 20));

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: orders,
            page,
            totalPages: Math.ceil(total / limit),
            total,
        });

    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new order with server-side price validation & calculation
// @route   POST /api/orders
router.post('/', async (req, res) => {
    try {
        const { customer, items, paymentMethod, isTaxIncluded } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item.' });
        }

        if (!['cash', 'upi', 'card'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method.' });
        }

        // Extract item IDs and query authoritative menu items from database
        const itemIds = items.map(oi => oi.item?.id).filter(Boolean);
        const dbItems = await MenuItem.find({ _id: { $in: itemIds }, userId: req.user.id });
        const dbItemMap = new Map(dbItems.map(item => [item._id.toString(), item]));

        let calculatedSubtotal = 0;
        const verifiedItems = [];

        for (const orderItem of items) {
            const itemId = orderItem.item?.id;
            const variantName = orderItem.selectedVariant?.name;
            const quantity = parseInt(orderItem.quantity, 10);

            if (!quantity || quantity <= 0) {
                return res.status(400).json({ message: 'Invalid quantity for an item.' });
            }

            const dbItem = dbItemMap.get(itemId);
            if (!dbItem) {
                return res.status(400).json({ message: `Item "${orderItem.item?.name || itemId}" not found in your menu.` });
            }

            const dbVariant = dbItem.variants.find(v => v.name === variantName);
            if (!dbVariant) {
                return res.status(400).json({ message: `Variant "${variantName}" not found for item "${dbItem.name}".` });
            }

            const lineTotal = dbVariant.price * quantity;
            calculatedSubtotal += lineTotal;

            verifiedItems.push({
                item: {
                    id: dbItem._id.toString(),
                    name: dbItem.name,
                    imageUrl: dbItem.imageUrl || '',
                },
                quantity,
                selectedVariant: {
                    name: dbVariant.name,
                    price: dbVariant.price,
                }
            });
        }

        calculatedSubtotal = parseFloat(calculatedSubtotal.toFixed(2));

        // Get restaurant tax rate from authoritative user profile
        const userProfile = await Profile.findOne({ userId: req.user.id });
        const taxRate = typeof userProfile?.taxRate === 'number' ? userProfile.taxRate : 0.18;

        // Apply tax if requested or if client order included tax
        const taxApplied = Boolean(isTaxIncluded || (req.body.tax && req.body.tax > 0));
        const calculatedTax = taxApplied ? parseFloat((calculatedSubtotal * taxRate).toFixed(2)) : 0;
        const calculatedTotal = parseFloat((calculatedSubtotal + calculatedTax).toFixed(2));

        // Customer data sanitization
        const customerData = {
            name: (customer?.name && typeof customer.name === 'string') 
                ? customer.name.trim().substring(0, 50) || 'Cash' 
                : 'Cash',
            mobile: (customer?.mobile && typeof customer.mobile === 'string') 
                ? customer.mobile.trim().substring(0, 20) 
                : '',
        };

        // Construct secure order document without mass assignment
        const newOrder = new Order({
            customer: customerData,
            items: verifiedItems,
            subtotal: calculatedSubtotal,
            tax: calculatedTax,
            total: calculatedTotal,
            currency: {
                code: 'INR',
                symbol: '₹',
                rate: 1
            },
            paymentMethod,
            date: new Date(),
            userId: req.user.id
        });

        const order = await newOrder.save();
        res.status(201).json(order);
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Server error creating order.' });
    }
});

module.exports = router;
