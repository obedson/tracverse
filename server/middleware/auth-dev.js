// Development mock authentication middleware
const authenticateToken = (req, res, next) => {
  // Mock user for development
  req.user = {
    userId: 'test-user-123',
    email: 'test@example.com'
  };
  next();
};

module.exports = { authenticateToken };
