// routes/analytics.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-dev'); // Use mock auth for development
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/analytics/performance-comparison
router.get('/performance-comparison', authenticateToken, async (req, res) => {
  try {
    // Calculate real performance comparison from database
    const { data: users } = await supabase
      .from('users')
      .select('rank, personal_volume, team_volume')
      .not('rank', 'is', null);

    if (!users || users.length === 0) {
      return res.json({ data: [] });
    }

    // Group by rank and calculate averages
    const rankGroups = users.reduce((acc, user) => {
      const rank = user.rank || 'Bronze';
      if (!acc[rank]) {
        acc[rank] = { members: 0, totalVolume: 0, totalEarnings: 0 };
      }
      acc[rank].members++;
      acc[rank].totalVolume += user.personal_volume || 0;
      acc[rank].totalEarnings += (user.personal_volume || 0) * 0.1; // 10% commission rate
      return acc;
    }, {});

    const performanceComparison = Object.entries(rankGroups).map(([rank, data]) => ({
      rank,
      members: data.members,
      avgVolume: Math.round(data.totalVolume / data.members),
      avgEarnings: Math.round(data.totalEarnings / data.members)
    }));

    res.json({ data: performanceComparison });
  } catch (error) {
    console.error('Performance comparison error:', error);
    res.status(500).json({ error: 'Failed to calculate performance comparison' });
  }
});

// Return 501 Not Implemented for endpoints not yet built
router.get('/team-performance', authenticateToken, (req, res) => {
  res.status(501).json({ 
    error: 'Team performance analytics not implemented',
    message: 'This feature is under development'
  });
});

router.get('/rank-distribution', authenticateToken, (req, res) => {
  res.status(501).json({ 
    error: 'Rank distribution analytics not implemented',
    message: 'This feature is under development'
  });
});

router.get('/top-performers', authenticateToken, (req, res) => {
  res.status(501).json({ 
    error: 'Top performers analytics not implemented',
    message: 'This feature is under development'
  });
});

router.get('/activity-timeline', authenticateToken, (req, res) => {
  res.status(501).json({ 
    error: 'Activity timeline not implemented',
    message: 'This feature is under development'
  });
});

router.get('/team-reports', authenticateToken, (req, res) => {
  res.status(501).json({ 
    error: 'Team reports not implemented',
    message: 'This feature is under development'
  });
});

module.exports = router;
