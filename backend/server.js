const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/user');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Seed admin user
const seedAdminUser = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            console.log('Admin user not found, creating one...');
            await User.create({
                username: process.env.ADMIN_USERNAME || 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin',
                role: 'admin'
            });
            console.log('Admin user created with default credentials (admin/admin).');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

// Wait for DB connection before seeding
mongoose.connection.once('open', () => {
    seedAdminUser();
});


// Body parser
app.use(express.json());

// Enable CORS
const allowedOrigins = [
  'https://quickbill-restaurant-pos.vercel.app',
  'http://localhost:5173', // For local development
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});