const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const DefaultUser = require('../models/user');
const DefaultOrder = require('../models/order');
const DefaultMenuItem = require('../models/menuItem');
const DefaultLog = require('../models/log');

const router = express.Router();

// Protect and authorize all routes in this file for admins only
router.use(protect);
router.use(authorize('admin'));

const getUser = (req) => (req.tenantModels && req.tenantModels.User) || DefaultUser;
const getOrder = (req) => (req.tenantModels && req.tenantModels.Order) || DefaultOrder;
const getMenuItem = (req) => (req.tenantModels && req.tenantModels.MenuItem) || DefaultMenuItem;
const getLog = (req) => (req.tenantModels && req.tenantModels.Log) || DefaultLog;

// @desc    Get dashboard stats for current restaurant
// @route   GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const User = getUser(req);
        const Order = getOrder(req);
        const MenuItem = getMenuItem(req);

        const userCount = await User.countDocuments();
        const orderCount = await Order.countDocuments();
        const menuCount = await MenuItem.countDocuments();
        
        const totalRevenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        const recentOrders = await Order.find().sort({ date: -1 }).limit(5).populate('userId', 'username');

        res.json({
            userCount,
            orderCount,
            menuCount,
            totalRevenue,
            recentOrders,
            tenant: req.tenant ? {
                slug: req.tenant.slug,
                name: req.tenant.name,
                status: req.tenant.status,
                activePlan: req.tenant.activePlan
            } : null
        });
    } catch (err) {
        console.error('[Admin Stats Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Get all users in current restaurant
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const User = getUser(req);
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error('[Admin Users GET Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Create a new staff user in current restaurant
// @route   POST /api/admin/users
router.post('/users', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Username and password (at least 6 characters) are required.' });
        }
        const User = getUser(req);
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username,
            password,
            role: 'staff'
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (err) {
        console.error('[Admin Users POST Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Reset a user's password
// @route   PUT /api/admin/users/:id/reset-password
router.put('/users/:id/reset-password', async (req, res) => {
    const { password } = req.body;
    try {
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }
        const User = getUser(req);
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin' && user._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Cannot reset password for another admin account' });
        }

        user.password = password;
        await user.save();

        res.status(200).json({ message: `Password for ${user.username} has been reset.`});
    } catch (err) {
        console.error('[Admin Reset Password Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Get all orders for current restaurant
// @route   GET /api/admin/orders
router.get('/orders', async (req, res) => {
    try {
        const Order = getOrder(req);
        const query = {};
        if (req.query.userId) {
            query.userId = req.query.userId;
        }
        const orders = await Order.find(query).populate('userId', 'username').sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        console.error('[Admin Orders Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Get all menu items for current restaurant
// @route   GET /api/admin/menu
router.get('/menu', async (req, res) => {
    try {
        const MenuItem = getMenuItem(req);
        const menuItems = await MenuItem.find().populate('userId', 'username').sort({ createdAt: -1 });
        res.json(menuItems);
    } catch (err) {
        console.error('[Admin Menu Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Admin adds a new menu item
// @route   POST /api/admin/menu
router.post('/menu', async (req, res) => {
    const { name, price, imageUrl, userId } = req.body;
    try {
        if (!name || !price || !imageUrl) {
            return res.status(400).json({ message: 'Name, price, and image URL are required.' });
        }
        const MenuItem = getMenuItem(req);
        const variants = [{ name: 'Default', price: parseFloat(price) }];

        const newItem = new MenuItem({ 
            name, 
            variants, 
            imageUrl, 
            userId: userId || req.user.id 
        });
        const menuItem = await newItem.save();
        res.status(201).json(menuItem);
    } catch (err) {
        console.error('[Admin Menu Create Error]:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: Object.values(err.errors).map(val => val.message).join(', ') });
        }
        res.status(500).send('Server Error');
    }
});

// @desc    Get all logs for current restaurant
// @route   GET /api/admin/logs
router.get('/logs', async (req, res) => {
    try {
        const Log = getLog(req);
        const query = {};
        if (req.query.userId && req.query.userId !== 'all') {
            query.userId = req.query.userId;
        }
        if (req.query.source && req.query.source !== 'all') {
            query.source = req.query.source;
        }
        if (req.query.level && req.query.level !== 'all') {
            query.level = req.query.level;
        }
        const logs = await Log.find(query).populate('userId', 'username').sort({ timestamp: -1 }).limit(200);
        res.json(logs);
    } catch (err) {
        console.error('[Admin Logs Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
