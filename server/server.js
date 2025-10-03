// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const generateRoute = require('./routes/generate');
const clicksRoute = require('./routes/clicks');
const utmConfigRoute = require('./routes/utmConfig');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins
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
app.use('/api/generate-url', generateRoute);
app.use('/api/clicks', clicksRoute);
app.use('/api/utm-config', utmConfigRoute);

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
