const express = require('express');
const DefaultMenuItem = require('../models/menuItem');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// All routes in this file are protected
router.use(protect);

const getMenuItem = (req) => (req.tenantModels && req.tenantModels.MenuItem) || DefaultMenuItem;

// @desc    Get menu items for the restaurant with server-side pagination, search, and sort
// @route   GET /api/menu
router.get('/', async (req, res) => {
    try {
        const MenuItem = getMenuItem(req);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        // In tenant-isolated DB, all items belong to this tenant. If userId was set, support backwards compatibility
        const query = {
            ...(search && typeof search === 'string' && search.trim() && { 
                name: { $regex: escapeRegex(search.trim()), $options: 'i' } 
            })
        };
        
        const sortConfig = {};
        if (sortBy === 'price') {
            sortConfig['variants.0.price'] = sortOrder;
        } else {
            sortConfig[sortBy] = sortOrder;
        }

        const total = await MenuItem.countDocuments(query);
        const menuItems = await MenuItem.find(query)
            .sort(sortConfig)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: menuItems,
            page,
            totalPages: Math.ceil(total / limit) || 1,
            total,
        });
    } catch (err) {
        console.error('[Menu GET Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Add a new menu item for the restaurant
// @route   POST /api/menu
router.post('/', authorize('admin', 'staff'), async (req, res) => {
    const { name, variants, imageUrl } = req.body;
    try {
        const MenuItem = getMenuItem(req);
        const newItem = new MenuItem({ 
            name, 
            variants, 
            imageUrl, 
            userId: req.user.id 
        });
        const menuItem = await newItem.save();
        res.json(menuItem);
    } catch (err) {
        console.error('[Menu POST Error]:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: Object.values(err.errors).map(val => val.message).join(', ') });
        }
        res.status(500).send('Server Error');
    }
});

// @desc    Update a menu item's name and/or price variants
// @route   PUT /api/menu/:id
router.put('/:id', authorize('admin', 'staff'), async (req, res) => {
    const { name, variants, imageUrl } = req.body;
    try {
        const MenuItem = getMenuItem(req);
        let menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ msg: 'Menu item not found' });
        }

        if (name !== undefined) {
            menuItem.name = name;
        }
        if (imageUrl !== undefined) {
            menuItem.imageUrl = imageUrl;
        }
        if (variants !== undefined) {
            if (!Array.isArray(variants) || variants.length === 0) {
                 return res.status(400).json({ msg: 'At least one price variant is required.' });
            }
            menuItem.variants = variants;
        }

        await menuItem.save();
        res.json(menuItem);
    } catch (err) {
        console.error('[Menu PUT Error]:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: Object.values(err.errors).map(val => val.message).join(', ') });
        }
        res.status(500).send('Server Error');
    }
});

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
router.delete('/:id', authorize('admin', 'staff'), async (req, res) => {
    try {
        const MenuItem = getMenuItem(req);
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ msg: 'Menu item not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('[Menu DELETE Error]:', err.message);
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
        const MenuItem = getMenuItem(req);
        await MenuItem.deleteMany({ _id: { $in: ids } });
        res.status(204).send();
    } catch (err) {
        console.error('[Menu DELETE-MANY Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;