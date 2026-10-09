const express = require('express');
const DefaultProfile = require('../models/profile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const getProfile = (req) => (req.tenantModels && req.tenantModels.Profile) || DefaultProfile;

// @desc    Get or create restaurant profile for the current restaurant
// @route   GET /api/profile
router.get('/', async (req, res) => {
    try {
        const Profile = getProfile(req);
        let profile = await Profile.findOne();
        if (!profile) {
            profile = await Profile.create({ 
                restaurantName: req.tenant?.name || 'FASTBILLO Restaurant',
                currency: req.tenant?.settings?.currency || 'INR',
                currencySymbol: req.tenant?.settings?.currencySymbol || '₹',
                taxRate: req.tenant?.settings?.taxRate !== undefined ? req.tenant.settings.taxRate : 0.05,
                userId: req.user.id 
            });
        }
        res.json(profile);
    } catch (err) {
        console.error('[Profile GET Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Update restaurant profile
// @route   PUT /api/profile
router.put('/', authorize('admin', 'staff'), async (req, res) => {
    const { restaurantName, address, phone, logoUrl, taxRate, currency, currencySymbol } = req.body;
    
    const fieldsToUpdate = {};
    if (restaurantName !== undefined) fieldsToUpdate.restaurantName = restaurantName;
    if (address !== undefined) fieldsToUpdate.address = address;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (logoUrl !== undefined) fieldsToUpdate.logoUrl = logoUrl;
    if (taxRate !== undefined) fieldsToUpdate.taxRate = taxRate;
    if (currency !== undefined) fieldsToUpdate.currency = currency;
    if (currencySymbol !== undefined) fieldsToUpdate.currencySymbol = currencySymbol;

    try {
        const Profile = getProfile(req);
        let profile = await Profile.findOneAndUpdate(
            {},
            { $set: fieldsToUpdate },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json(profile);
    } catch (err) {
        console.error('[Profile PUT Error]:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;