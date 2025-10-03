const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/user');

// Load environment variables
dotenv.config();

// Connect to MongoDB
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
        password: process.env.ADMIN_PASSWORD || 'Test@1234',
        role: 'admin',
      });
      console.log('✅ Admin user created with default credentials (admin/Test@1234)');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
};

mongoose.connection.once('open', () => {
  seedAdminUser();
});

// Middleware
app.use(express.json());

// CORS setup
const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g., https://quickbill-restaurant-pos.vercel.app
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/admin', require('./routes/admin'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});