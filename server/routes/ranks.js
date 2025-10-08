// routes/ranks.js
const express = require('express');
const router = express.Router();
const mlmService = require('../services/mlmService');

/**
 * POST /api/ranks/apply-protection
 * Apply rank protection for user
 */
router.post('/apply-protection', async (req, res) => {
  try {
    const { user_id, period } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await mlmService.applyRankProtection(user_id, period);

    res.json({
      message: 'Rank protection processed',
      result
    });

  } catch (error) {
    console.error('Rank Protection Error:', error);
    res.status(500).json({ 
      error: 'Failed to apply rank protection',
      message: error.message 
    });
  }
});

/**
 * POST /api/ranks/handle-demotion
 * Handle rank demotion process
 */
router.post('/handle-demotion', async (req, res) => {
  try {
    const { user_id, new_rank, reason } = req.body;

    if (!user_id || !new_rank) {
      return res.status(400).json({ error: 'User ID and new rank are required' });
    }

    const result = await mlmService.handleRankDemotion(user_id, new_rank, reason);

    res.json({
      message: 'Demotion processed successfully',
      result
    });

  } catch (error) {
    console.error('Demotion Handling Error:', error);
    res.status(500).json({ 
      error: 'Failed to handle demotion',
      message: error.message 
    });
  }
});

module.exports = router;
