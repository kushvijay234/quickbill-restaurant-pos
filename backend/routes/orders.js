
const express = require('express');
const Order = require('../models/order');
const { protect } = require('../middleware/auth');

const router = express.Router();

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
        res.status(500).send('Server Error');
    }
});

// @desc    Get all orders for the logged-in user with server-side handling
// @route   GET /api/orders
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
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

        // Search filtering
        if (search) {
             const searchRegex = { $regex: search, $options: 'i' };
             const isNumeric = !isNaN(parseFloat(search)) && isFinite(search);
             
             const searchOrConditions = [
                { 'customer.name': searchRegex },
                { 'id': searchRegex }
             ];

             if(isNumeric){
                 // A simple way to check if search string could match total.
                 // This won't be indexed and can be slow on large datasets, but is okay for this scale.
                 // A better approach would be a dedicated text index or a more complex aggregation pipeline.
                 // For now, this is a reasonable trade-off.
             }

            query.$or = searchOrConditions;
        }
        
        // Special case for CSV export: limit=0 means get all
        if (limit === 0) {
            const allOrders = await Order.find(query).sort({ [sortBy]: sortOrder });
            return res.json({ data: allOrders, total: allOrders.length, totalPages: 1, page: 1 });
        }

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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @desc    Create a new order for the logged-in user
// @route   POST /api/orders
router.post('/', async (req, res) => {
    try {
        const newOrder = new Order({
            ...req.body,
            date: new Date().toISOString(),
            userId: req.user.id
        });
        const order = await newOrder.save();
        res.status(201).json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
