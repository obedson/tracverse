const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

// Enterprise authentication middleware with cookie support
const authenticateToken = (req, res, next) => {
  // Try to get token from cookies first (more secure)
  let token = req.cookies?.accessToken;
  
  // Fallback to Authorization header for API compatibility
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Token expired or invalid
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired', 
          code: 'TOKEN_EXPIRED' 
        });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

// Optional authentication
const optionalAuth = (req, res, next) => {
  let token = req.cookies?.accessToken;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

// Admin authentication (for admin routes)
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    // Add admin check logic here if needed
    // For now, all authenticated users can access admin features
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateAdmin,
  JWT_SECRET
};
