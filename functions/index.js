const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { verifyAuth } = require('./middleware/auth');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'QuikThread Backend'
  });
});

// Root endpoint (no auth required)
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'QuikThread Backend API',
    version: '1.0.0'
  });
});

// Apply authentication to all /api/* routes except /api/webhooks/*
app.use('/api', (req, res, next) => {
  // Skip auth for webhook routes
  if (req.path.startsWith('/webhooks/')) {
    return next();
  }
  // Apply auth middleware for all other API routes
  return verifyAuth(req, res, next);
});

// Import API routes
const { router: usersRouter } = require('./api/users');
const { router: uploadRouter } = require('./api/upload');
const { checkFeature } = require('./middleware/checkFeature');
const { checkQuota } = require('./middleware/checkQuota');

// Mount API routes
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/process', checkQuota, require('./api/process'));
app.use('/api/jobs', require('./api/jobs'));
app.use('/api/twitter', require('./api/twitter'));
app.use('/api/analytics', require('./api/analytics'));

// Test protected endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Protected endpoint accessed successfully',
    userId: req.userId,
    userEmail: req.userEmail
  });
});

// Test analytics endpoint (requires analytics feature) - REMOVED: Replaced by /api/analytics routes

// Test postToX endpoint (requires postToX feature)
app.post('/api/post-to-x', checkFeature('postToX'), (req, res) => {
  res.status(200).json({
    message: 'Post to X endpoint accessed successfully',
    userId: req.userId,
    posted: true
  });
});

// Process endpoint is mounted above with quota middleware

// Test webhook endpoint (no auth required)
app.post('/api/webhooks/test', (req, res) => {
  res.status(200).json({
    message: 'Webhook endpoint accessed successfully',
    timestamp: new Date().toISOString()
  });
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
