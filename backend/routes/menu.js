
const express = require('express');
const MenuItem = require('../models/menuItem');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @desc    Get menu items for the logged-in user with server-side pagination, search, and sort
// @route   GET /api/menu
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        const query = { 
            userId: req.user.id,
            // Case-insensitive search
            ...(search && { name: { $regex: search, $options: 'i' } })
        };

        const total = await MenuItem.countDocuments(query);
        const menuItems = await MenuItem.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: menuItems,
            page,
            totalPages: Math.ceil(total / limit),
            total,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Add a new menu item for the logged-in user
// @route   POST /api/menu
router.post('/', authorize('admin', 'staff'), async (req, res) => {
    const { name, price, imageUrl } = req.body;
    try {
        const newItem = new MenuItem({ name, price, imageUrl, userId: req.user.id });
        const menuItem = await newItem.save();
        res.json(menuItem);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Update a menu item's name and/or price
// @route   PUT /api/menu/:id
router.put('/:id', authorize('admin', 'staff'), async (req, res) => {
    const { name, price } = req.body;
    try {
        let menuItem = await MenuItem.findOne({ _id: req.params.id, userId: req.user.id });
        if (!menuItem) {
            return res.status(404).json({ msg: 'Menu item not found or you do not have permission' });
        }

        if (name !== undefined) {
            menuItem.name = name;
        }
        if (price !== undefined) {
            menuItem.price = price;
        }

        await menuItem.save();
        res.json(menuItem);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
router.delete('/:id', authorize('admin', 'staff'), async (req, res) => {
    try {
        const menuItem = await MenuItem.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!menuItem) {
            return res.status(404).json({ msg: 'Menu item not found or you do not have permission' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Menu item not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @desc    Delete multiple menu items
// @route   POST /api/menu/delete-many
router.post('/delete-many', authorize('admin', 'staff'), async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: 'Item IDs are required' });
    }
    try {
        await MenuItem.deleteMany({ _id: { $in: ids }, userId: req.user.id });
        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
