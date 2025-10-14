// routes/commissions.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-enterprise');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /api/commissions
 * Get user's commission history and statistics
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status, type } = req.query;

    let query = supabase
      .from('commissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: commissions, error: commissionsError } = await query;

    if (commissionsError) {
      return res.status(500).json({ error: 'Failed to fetch commissions' });
    }

    // Get commission statistics
    const { data: stats, error: statsError } = await supabase
      .from('commissions')
      .select('amount, status, type')
      .eq('user_id', userId);

    if (statsError) {
      return res.status(500).json({ error: 'Failed to fetch commission stats' });
    }

    const totalEarnings = stats?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;
    const pendingEarnings = stats?.filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;
    const paidEarnings = stats?.filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;

    res.success({
      commissions: commissions || [],
      statistics: {
        total_earnings: totalEarnings,
        pending_earnings: pendingEarnings,
        paid_earnings: paidEarnings,
        total_commissions: stats?.length || 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: stats?.length || 0
      }
    }, 'Commissions retrieved successfully');

  } catch (error) {
    console.error('Commissions fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/commissions/process-task
 * Process task completion and calculate commissions
 */
router.post('/process-task', async (req, res) => {
  try {
    const { user_id, points_earned } = req.body;

    if (!user_id || !points_earned) {
      return res.status(400).json({ 
        error: 'User ID and points earned are required' 
      });
    }

    const result = await mlmService.processTaskCompletion(user_id, points_earned);

    res.json({
      message: 'Task processed successfully',
      points_added: result.points_added,
      commissions_created: result.commissions.length,
      commissions: result.commissions
    });

  } catch (error) {
    console.error('Task Processing Error:', error);
    res.status(500).json({ 
      error: 'Failed to process task',
      message: error.message 
    });
  }
});

/**
 * POST /api/commissions/run-commissions
 * Execute commission run for period
 */
router.post('/run-commissions', async (req, res) => {
  try {
    const { period, run_type = 'monthly' } = req.body;

    if (!period) {
      return res.status(400).json({ error: 'Period is required (YYYY-MM format)' });
    }

    const results = await mlmService.executeCommissionRun(period, run_type);

    res.json({
      message: 'Commission run completed successfully',
      results
    });

  } catch (error) {
    console.error('Commission Run Error:', error);
    res.status(500).json({ 
      error: 'Failed to execute commission run',
      message: error.message 
    });
  }
});

/**
 * POST /api/commissions/leadership-bonuses
 * Calculate leadership bonuses for team builders
 */
router.post('/leadership-bonuses', async (req, res) => {
  try {
    const { period } = req.body;
    
    const bonuses = await mlmService.calculateLeadershipBonuses(period);

    res.json({
      message: 'Leadership bonuses calculated successfully',
      period: period || new Date().toISOString().slice(0, 7),
      bonuses_created: bonuses.length,
      total_amount: bonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0),
      bonuses
    });

  } catch (error) {
    console.error('Leadership Bonus Error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate leadership bonuses',
      message: error.message 
    });
  }
});

/**
 * POST /api/commissions/rank-bonuses
 * Calculate monthly rank bonuses
 */
router.post('/rank-bonuses', async (req, res) => {
  try {
    const { period } = req.body;
    
    const bonuses = await mlmService.calculateRankBonuses(period);

    res.json({
      message: 'Rank bonuses calculated successfully',
      period: period || new Date().toISOString().slice(0, 7),
      bonuses_created: bonuses.length,
      total_amount: bonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0),
      bonuses
    });

  } catch (error) {
    console.error('Rank Bonus Error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate rank bonuses',
      message: error.message 
    });
  }
});

/**
 * GET /api/commissions/earnings/:userId
 * Get user's commission earnings
 */
router.get('/earnings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period, status = 'all' } = req.query;

    let query = supabase
      .from('commissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (period) {
      query = query.eq('period', period);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: commissions, error } = await query;

    if (error) throw error;

    // Calculate totals
    const totalEarnings = commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const pendingEarnings = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);

    res.json({
      commissions,
      summary: {
        total_earnings: totalEarnings,
        pending_earnings: pendingEarnings,
        total_commissions: commissions.length
      }
    });

  } catch (error) {
    console.error('Earnings Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch earnings',
      message: error.message 
    });
  }
});

/**
 * GET /api/commissions/breakdown/:userId
 * Get commission breakdown by type and level
 */
router.get('/breakdown/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: commissions, error } = await supabase
      .from('commissions')
      .select('commission_type, level, amount')
      .eq('user_id', userId);

    if (error) throw error;

    const breakdown = commissions.reduce((acc, comm) => {
      const key = `${comm.commission_type}_level_${comm.level}`;
      if (!acc[key]) {
        acc[key] = { count: 0, total: 0, type: comm.commission_type, level: comm.level };
      }
      acc[key].count++;
      acc[key].total += parseFloat(comm.amount);
      return acc;
    }, {});

    res.json({
      breakdown: Object.values(breakdown),
      total_by_type: commissions.reduce((acc, comm) => {
        if (!acc[comm.commission_type]) acc[comm.commission_type] = 0;
        acc[comm.commission_type] += parseFloat(comm.amount);
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Breakdown Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch breakdown',
      message: error.message 
    });
  }
});

module.exports = router;
