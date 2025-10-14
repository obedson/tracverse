const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-enterprise');
const { checkEarningsCap, EARNING_CAPS } = require('../middleware/earnings-cap');

// Get user's earnings cap status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const capStatus = await checkEarningsCap(userId);
    
    res.success({
      ...capStatus,
      earningCaps: EARNING_CAPS
    });
  } catch (error) {
    console.error('Earnings cap status error:', error);
    res.error('Failed to get earnings cap status', 500);
  }
});

module.exports = router;
