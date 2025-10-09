const { verifyToken } = require('../utils/auth');

const authenticateToken = (req, res, next) => {
  // Only use mock auth in development with explicit flag
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AUTH === 'true') {
    req.user = { userId: 'test-user-123', email: 'test@example.com' };
    return next();
  }

  // Production authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
