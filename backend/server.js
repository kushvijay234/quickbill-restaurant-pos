const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Database connections
const connectDB = require('./config/db');
const { connectMasterDB } = require('./config/masterDb');
const { closeAllTenantConnections } = require('./config/tenantManager');

// Middleware
const { resolveTenant } = require('./middleware/tenantResolver');
const { subscriptionGuard } = require('./middleware/subscriptionGuard');
const User = require('./models/user');

// Load environment variables
dotenv.config();

// Ensure mandatory JWT_SECRET is configured
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}

// Initialize Databases: Control Plane (Master DB) + Local/Legacy DB
(async () => {
    try {
        await connectMasterDB();
        // Run automated inactive trial data pruning on startup and every 24 hours
        const { cleanExpiredTrialData } = require('./services/trialCleanupService');
        cleanExpiredTrialData().catch((err) => console.warn('[Trial Cleanup Startup Note]:', err.message));
        setInterval(() => {
            cleanExpiredTrialData().catch((err) => console.warn('[Trial Cleanup Cron Error]:', err.message));
        }, 24 * 60 * 60 * 1000);
    } catch (err) {
        console.error('CRITICAL: Failed to connect to Master Database:', err.message);
    }
    try {
        await connectDB();
    } catch (err) {
        console.warn('Notice: Legacy DB connection fallback note:', err.message);
    }
})();

const app = express();

// Security headers with helmet
app.use(helmet());

// Global Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Body parser
app.use(express.json({ limit: '2mb' }));

// Enable CORS with support for multi-tenant subdomains
const allowedOrigins = [
    "http://localhost:5173",
    "https://quickbill-restaurant-pos.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow dynamic tenant subdomains on localhost or vercel app
        if (/^https?:\/\/([a-z0-9-]+)\.localhost(:\d+)?$/.test(origin) ||
            /^https?:\/\/([a-z0-9-]+)\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive for SaaS multi-tenant API clients
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
    credentials: true
  })
);

// Health & System status check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        architecture: 'multi-tenant-database-per-tenant',
        billing: 'razorpay-subscription-enabled',
        timestamp: new Date()
    });
});

// Seed default legacy admin user if default DB connected
const seedAdminUser = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            const adminExists = await User.findOne({ role: 'admin' });
            if (!adminExists) {
                await User.create({
                    username: process.env.ADMIN_USERNAME || 'admin',
                    password: process.env.ADMIN_PASSWORD || 'admin',
                    role: 'admin'
                });
                console.log('Legacy default admin user verified.');
            }
        }
    } catch (error) {
        console.warn('Notice: Legacy admin user seed skipped:', error.message);
    }
};

mongoose.connection.once('open', () => {
    seedAdminUser();
});

// SaaS Master Control Plane Routes (Public Onboarding & Billing)
app.use('/api/saas', require('./routes/onboarding'));
app.use('/api/subscription', require('./routes/subscription'));

// Tenant Resolution & Subscription Enforcement for Data Plane Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', resolveTenant({ optional: true }), subscriptionGuard, require('./routes/menu'));
app.use('/api/orders', resolveTenant({ optional: true }), subscriptionGuard, require('./routes/orders'));
app.use('/api/profile', resolveTenant({ optional: true }), subscriptionGuard, require('./routes/profile'));
app.use('/api/logs', resolveTenant({ optional: true }), require('./routes/logs'));
app.use('/api/admin', resolveTenant({ optional: true }), subscriptionGuard, require('./routes/admin'));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(` RESTOBILL Multi-Tenant SaaS Server running on port ${PORT}`);
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
    console.log('Closing server and tenant database connections...');
    server.close(async () => {
        await closeAllTenantConnections();
        if (mongoose.connection) {
            await mongoose.connection.close();
        }
        console.log('Server and database connections closed cleanly.');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);