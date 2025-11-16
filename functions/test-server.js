const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Import Firebase Admin for token verification
const { auth } = require('./config/firebase');

// Auth middleware that accepts both mock tokens and real Firebase tokens
const mockAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header'
    });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // Accept mock token for testing
  if (token === 'test-token') {
    req.userId = 'test-user-id';
    req.userEmail = 'test@example.com';
    req.userEmailVerified = true;
    return next();
  }
  
  // Try to verify real Firebase token
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    req.userEmailVerified = decodedToken.email_verified;
    return next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'QuikThread Backend Test Server'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'QuikThread Backend API Test Server',
    version: '1.0.0'
  });
});

// Apply auth to all /api/* routes
app.use('/api', mockAuth);

// Import API routes
const { router: usersRouter } = require('./api/users');
const { router: uploadRouter } = require('./api/upload-simple'); // Using simplified upload for testing
const processRouter = require('./api/process');
const jobsRouter = require('./api/jobs');
const twitterRouter = require('./api/twitter');
const analyticsRouter = require('./api/analytics');

// Mount API routes
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/process', processRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/twitter', twitterRouter);
app.use('/api/analytics', analyticsRouter);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Protected endpoint accessed successfully',
    userId: req.userId,
    userEmail: req.userEmail
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});
