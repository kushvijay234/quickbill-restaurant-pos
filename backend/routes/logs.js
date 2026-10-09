const express = require('express');
const rateLimit = require('express-rate-limit');
const DefaultLog = require('../models/log');
const { optionalProtect, protect, authorize } = require('../middleware/auth');
const { getTenantConnection } = require('../config/tenantManager');

const router = express.Router();

const logLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 120, // Allow up to 120 logs per 5 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Log rate limit exceeded' }
});

/**
 * Helper to get the correct Log model (tenant-specific or master fallback)
 */
const resolveLogModel = async (req) => {
    if (req.tenantModels && req.tenantModels.Log) {
        return { LogModel: req.tenantModels.Log, slug: req.tenantSlug || req.tenant?.slug };
    }

    const requestedSlug = (
        req.headers['x-tenant-id'] ||
        req.body?.tenantSlug ||
        req.query?.tenantSlug ||
        ''
    ).toLowerCase().trim();

    if (requestedSlug) {
        try {
            const { models, tenant } = await getTenantConnection(requestedSlug);
            if (models && models.Log) {
                return { LogModel: models.Log, slug: requestedSlug, tenant };
            }
        } catch (tErr) {
            // Tenant could not be resolved, fall back to Master DB
        }
    }

    return { LogModel: DefaultLog, slug: requestedSlug || 'global' };
};

// @desc    Create an error or event log entry in the database (Web & Mobile)
// @route   POST /api/logs
router.post('/', optionalProtect, logLimiter, async (req, res) => {
    try {
        const {
            level = 'error',
            message,
            source = 'web',
            platform,
            endpoint,
            statusCode,
            stack,
            meta,
            tenantSlug
        } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: 'Log message is required and must be a string' });
        }

        const validLevel = ['info', 'warn', 'error'].includes(level) ? level : 'error';
        const validSource = ['web', 'mobile', 'backend', 'system'].includes(source) ? source : 'web';

        const safeMessage = message.trim().substring(0, 1000);
        const safePlatform = (platform || req.headers['user-agent'] || '').toString().substring(0, 255);
        const safeEndpoint = (endpoint || '').toString().substring(0, 255);
        const safeStack = (stack || '').toString().substring(0, 4096);

        let safeMeta = meta;
        if (meta && typeof meta === 'object') {
            try {
                const metaStr = JSON.stringify(meta);
                if (metaStr.length > 4096) {
                    safeMeta = { truncated: true, summary: metaStr.substring(0, 1000) };
                }
            } catch {
                safeMeta = { parseError: 'Metadata could not be serialized' };
            }
        }

        const { LogModel, slug } = await resolveLogModel(req);

        const newLog = new LogModel({
            level: validLevel,
            message: safeMessage,
            source: validSource,
            platform: safePlatform,
            endpoint: safeEndpoint,
            statusCode: typeof statusCode === 'number' ? statusCode : undefined,
            stack: safeStack,
            tenantSlug: slug || tenantSlug || '',
            meta: safeMeta,
            userId: req.user?._id || req.user?.id || null,
            timestamp: new Date()
        });

        await newLog.save();

        res.status(201).json({
            success: true,
            logId: newLog.id || newLog._id
        });
    } catch (err) {
        console.error('[Client Log Save Error]:', err.message);
        res.status(500).json({ success: false, message: 'Failed to record log in database' });
    }
});

// @desc    Get audit and error logs for the active restaurant workspace
// @route   GET /api/logs
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { LogModel } = await resolveLogModel(req);
        const query = {};

        if (req.query.level && req.query.level !== 'all') {
            query.level = req.query.level;
        }
        if (req.query.source && req.query.source !== 'all') {
            query.source = req.query.source;
        }
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 300);
        const logs = await LogModel.find(query)
            .populate('userId', 'username role')
            .sort({ timestamp: -1 })
            .limit(limit);

        res.json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (err) {
        console.error('[Fetch Logs Error]:', err.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve logs' });
    }
});

module.exports = router;