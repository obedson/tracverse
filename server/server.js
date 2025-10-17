// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Import routes
const generateRoute = require('./routes/generate');
const clicksRoute = require('./routes/clicks');
const utmConfigRoute = require('./routes/utmConfig');
const referralsRoute = require('./routes/referrals');
const commissionsRoute = require('./routes/commissions');
const adminCommissionPlansRoute = require('./routes/admin-commission-plans');
const payoutsRoute = require('./routes/payouts');
const tasksRoute = require('./routes/tasks');
const qualificationsRoute = require('./routes/qualifications');
const marketingRoute = require('./routes/marketing');

// Import middleware
const { formatResponse } = require('./middleware/responseFormatter');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { securityHeaders } = require('./middleware/security');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(securityHeaders); // Apply security headers
app.use(apiLimiter); // Apply rate limiting to all routes
app.use(formatResponse); // Add response formatting helpers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Tracverse API'
  });
});

// API Routes
app.use('/api/generate-url', require('./routes/generate-compliant'));
app.use('/api/clicks', clicksRoute);
app.use('/api/utm-config', utmConfigRoute);
app.use('/api/referral-dashboard', require('./routes/referral-dashboard'));
app.use('/api/utm-analytics', require('./routes/utm-analytics'));
app.use('/api/qr-codes', require('./routes/qr-codes'));
app.use('/api/referral-tracking', require('./routes/referral-tracking'));
app.use('/api/referrals', referralsRoute);
app.use('/api/commissions', commissionsRoute);
app.use('/api/admin/commission-plans', adminCommissionPlansRoute);
app.use('/api/verification', require('./routes/verification'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/social-proof', require('./routes/social-proof'));
app.use('/api/pp-wallet', require('./routes/pp-wallet'));
app.use('/api/membership-plans', require('./routes/membership-plans'));
app.use('/api/earnings-cap', require('./routes/earnings-cap'));
// Mock routes for testing when Supabase is unavailable
app.use('/api/referrals-mock', require('./routes/referrals-mock'));
app.use('/api/commissions-mock', require('./routes/commissions-mock'));
app.use('/api/payouts', payoutsRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/qualifications', qualificationsRoute);
app.use('/api/marketing', marketingRoute);
// Auth routes - Enterprise only
app.use('/api/auth-enterprise', require('./routes/auth-enterprise'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/ranks', require('./routes/ranks'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/kyc', require('./routes/kyc'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Tracverse Tracking API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      generateUrl: 'POST /api/generate-url',
      getClicks: 'GET /api/clicks',
      getUtmConfig: 'GET /api/utm-config',
      setUtmConfig: 'POST /api/utm-config',
      getAllUtmConfigs: 'GET /api/utm-config/all'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Tracverse API Server Started');
  console.log('=================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('=================================');
});

module.exports = app;
