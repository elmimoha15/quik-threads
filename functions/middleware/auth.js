const { auth } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID token
 * Extracts Bearer token from Authorization header and verifies it
 * Attaches userId to request object for downstream use
 */
const verifyAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected format: Bearer <token>'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Development bypass for emulator testing with test token
    if (process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true') {
      if (token === 'test-token') {
        req.userId = 'test-user-id';
        req.userEmail = 'test@example.com';
        req.userEmailVerified = true;
        return next();
      }
    }

    try {
      // Verify the ID token with Firebase Auth
      const decodedToken = await auth.verifyIdToken(token);
      
      // Attach user ID to request object
      req.userId = decodedToken.uid;
      req.userEmail = decodedToken.email;
      req.userEmailVerified = decodedToken.email_verified;
      
      // Continue to next middleware/route handler
      return next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      throw verifyError;
    }
    
  } catch (error) {
    console.error('Auth verification error:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'The provided token has expired. Please refresh your authentication.'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Token Revoked',
        message: 'The provided token has been revoked. Please re-authenticate.'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'The provided token is invalid or malformed.'
      });
    }
    
    // Generic auth error
    return res.status(401).json({
      error: 'Authentication Failed',
      message: 'Failed to verify authentication token'
    });
  }
};

/**
 * Optional middleware to verify auth but not fail if no token provided
 * Useful for endpoints that work for both authenticated and anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user info
      req.userId = null;
      req.userEmail = null;
      req.userEmailVerified = false;
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      req.userId = null;
      req.userEmail = null;
      req.userEmailVerified = false;
      return next();
    }

    // Try to verify the token
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    req.userEmailVerified = decodedToken.email_verified;
    
    next();
    
  } catch (error) {
    // If token verification fails, continue without user info
    console.warn('Optional auth verification failed:', error.message);
    req.userId = null;
    req.userEmail = null;
    req.userEmailVerified = false;
    next();
  }
};

module.exports = {
  verifyAuth,
  optionalAuth
};
