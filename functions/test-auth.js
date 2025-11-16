// Simple test script to verify authentication middleware
const express = require('express');
const { verifyAuth } = require('./middleware/auth');

const app = express();
app.use(express.json());

// Test endpoint with auth
app.get('/test', verifyAuth, (req, res) => {
  res.json({
    message: 'Authentication successful',
    userId: req.userId,
    userEmail: req.userEmail
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
  console.log('Test endpoints:');
  console.log('  GET /test (requires auth) - should return 401 without token');
});

// Test the middleware directly
console.log('\n=== Testing Auth Middleware ===');

// Mock request without token
const mockReq1 = { headers: {} };
const mockRes1 = {
  status: (code) => ({
    json: (data) => console.log(`❌ No token test: ${code} -`, data.message)
  })
};

verifyAuth(mockReq1, mockRes1, () => {
  console.log('✅ Should not reach here without token');
});

// Mock request with invalid token
const mockReq2 = { headers: { authorization: 'Bearer invalid-token' } };
const mockRes2 = {
  status: (code) => ({
    json: (data) => console.log(`❌ Invalid token test: ${code} -`, data.message)
  })
};

verifyAuth(mockReq2, mockRes2, () => {
  console.log('✅ Should not reach here with invalid token');
});
