const express = require('express');
const rateLimit = require('express-rate-limit');
const DefaultLog = require('../models/log');
const { protect } = require('../middleware/auth');

const router = express.Router();

const logLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 60, // Max 60 logs per 5 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Log rate limit exceeded' }
});

const getLog = (req) => (req.tenantModels && req.tenantModels.Log) || DefaultLog;

// @desc    Create a log entry in tenant database
// @route   POST /api/logs
router.post('/', protect, logLimiter, async (req, res) => {
    try {
        const { level, message, meta } = req.body;

        if (!level || !message || typeof message !== 'string' || !['info', 'warn', 'error'].includes(level)) {
            return res.status(400).json({ success: false, message: 'Invalid log payload' });
        }

        const safeMessage = message.trim().substring(0, 500);
        let safeMeta = meta;
        if (meta && typeof meta === 'object') {
            const metaStr = JSON.stringify(meta);
            if (metaStr.length > 2048) {
                safeMeta = { truncated: true, summary: metaStr.substring(0, 500) };
            }
        }

        const Log = getLog(req);
        const newLog = new Log({ 
            level, 
            message: safeMessage, 
            meta: safeMeta, 
            userId: req.user.id 
        });
        await newLog.save();
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Failed to save client log:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;