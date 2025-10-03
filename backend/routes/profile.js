const express = require('express');
const Profile = require('../models/profile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @desc    Get or create restaurant profile for the logged-in user
// @route   GET /api/profile
router.get('/', async (req, res) => {
    try {
        let profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            profile = await Profile.create({
                userId: req.user.id,
                restaurantName: 'My Restaurant',
                address: '123 Main Street',
                phone: '555-1234'
            });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Update restaurant profile for the logged-in user (upsert)
// @route   PUT /api/profile
router.put('/', authorize('admin', 'staff'), async (req, res) => {
    const { restaurantName, address, phone } = req.body;
    const profileFields = { restaurantName, address, phone, userId: req.user.id };

    try {
        let profile = await Profile.findOneAndUpdate(
            { userId: req.user.id },
            { $set: profileFields },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;