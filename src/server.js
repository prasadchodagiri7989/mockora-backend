require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Allowed frontend origins from environment variables with local defaults
const envOrigins = [
  process.env.FRONTEND_BASE_URL,
  process.env.ADMIN_BASE_URL,
  process.env.LANDING_BASE_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [])
].filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];

const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in local development
    }
  },
  credentials: true,
}));

// Capture raw body for Cashfree webhook HMAC verification
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  require('dotenv').config();
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    smtpUser: process.env.SMTP_USER || null,
    db: process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@')[1] || 'local' : 'unknown',
    timestamp: new Date(),
    service: 'MockOra Platform API',
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));
app.use('/api/practice', require('./routes/practiceRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 MockOra API Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`🤖 Gemini AI Review: ${process.env.GEMINI_API_KEY ? `Enabled (${process.env.GEMINI_MODEL || 'gemini-1.5-flash'})` : 'Disabled (Key missing)'}`);
  console.log(`=============================================`);
});

module.exports = { app, server };
