// routes/analytics.js
const express = require('express');
const router = express.Router();
const mlmService = require('../services/mlmService');
const { supabase } = require('../config/supabase');

/**
 * GET /api/analytics/performance-comparison/:userId
 * Get performance comparisons for user
 */
router.get('/performance-comparison/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const comparison = await mlmService.getPerformanceComparisons(userId);

    res.json(comparison);

  } catch (error) {
    console.error('Performance Comparison Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch performance comparison',
      message: error.message 
    });
  }
});

/**
 * GET /api/analytics/rank-progression/:userId
 * Get rank progression tracking for user
 */
router.get('/rank-progression/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const progression = await mlmService.getRankProgression(userId);

    res.json(progression);

  } catch (error) {
    console.error('Rank Progression Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rank progression',
      message: error.message 
    });
  }
});

/**
 * GET /api/analytics/projections/:userId
 * Get growth projections for user
 */
router.get('/projections/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { months = 6 } = req.query;

    const projections = await mlmService.getGrowthProjections(userId, parseInt(months));

    res.json(projections);

  } catch (error) {
    console.error('Growth Projections Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate projections',
      message: error.message 
    });
  }
});

/**
 * GET /api/analytics/earnings-history/:userId
 * Get historical earnings data for user
 */
router.get('/earnings-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { months = 12 } = req.query;

    const history = await mlmService.getHistoricalEarnings(userId, parseInt(months));

    res.json(history);

  } catch (error) {
    console.error('Earnings History Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch earnings history',
      message: error.message 
    });
  }
});

/**
 * GET /api/analytics/volume-report/:userId
 * Get team volume report for user
 */
router.get('/volume-report/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query;

    const report = await mlmService.getTeamVolumeReport(userId, period);

    res.json(report);

  } catch (error) {
    console.error('Volume Report Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate volume report',
      message: error.message 
    });
  }
});

/**
 * GET /api/analytics/leaderboard
 * Get performance leaderboards
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'earnings', period = 'monthly', limit = 10 } = req.query;

    const leaderboard = await mlmService.getLeaderboard(type, period, parseInt(limit));

    res.json({
      type,
      period,
      leaderboard,
      count: leaderboard.length
    });

  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      message: error.message 
    });
  }
});

/**
 * GET /api/analytics/tree/:userId
 * Get visual tree data for user
 */
router.get('/tree/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { depth = 3 } = req.query;

    const treeData = await mlmService.getVisualTree(userId, parseInt(depth));

    res.json({
      tree: treeData,
      total_nodes: countNodes(treeData)
    });

  } catch (error) {
    console.error('Visual Tree Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate tree visualization',
      message: error.message 
    });
  }
});

function countNodes(node) {
  if (!node) return 0;
  return 1 + (node.children || []).reduce((sum, child) => sum + countNodes(child), 0);
}

module.exports = router;
