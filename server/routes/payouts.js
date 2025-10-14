// routes/payouts.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-enterprise');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /api/payouts
 * Get user's payout history and statistics
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;

    let query = supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    // Apply status filter
    if (status) query = query.eq('status', status);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: payouts, error: payoutsError } = await query;

    if (payoutsError) {
      return res.status(500).json({ error: 'Failed to fetch payouts' });
    }

    // Get payout statistics
    const { data: stats, error: statsError } = await supabase
      .from('payouts')
      .select('amount, status')
      .eq('user_id', userId);

    if (statsError) {
      return res.status(500).json({ error: 'Failed to fetch payout stats' });
    }

    const totalRequested = stats?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    const totalPaid = stats?.filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    const pendingAmount = stats?.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

    res.success({
      payouts: payouts || [],
      statistics: {
        total_requested: totalRequested,
        total_paid: totalPaid,
        pending_amount: pendingAmount,
        total_requests: stats?.length || 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: stats?.length || 0
      }
    }, 'Payouts retrieved successfully');

  } catch (error) {
    console.error('Payouts fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payouts/process
 * Process payouts for eligible users
 */
router.post('/process', async (req, res) => {
  try {
    const { period } = req.body;
    
    const payouts = await mlmService.processPayouts(period);

    res.json({
      message: 'Payouts processed successfully',
      period: period || new Date().toISOString().slice(0, 7),
      payouts_created: payouts.length,
      total_amount: payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      payouts
    });

  } catch (error) {
    console.error('Payout Processing Error:', error);
    res.status(500).json({ 
      error: 'Failed to process payouts',
      message: error.message 
    });
  }
});

/**
 * POST /api/payouts/settings
 * Set user payout preferences
 */
router.post('/settings', async (req, res) => {
  try {
    const { user_id, minimum_threshold, payment_method, payment_details, auto_payout } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const settings = await mlmService.setPayoutSettings(user_id, {
      minimum_threshold,
      payment_method,
      payment_details,
      auto_payout
    });

    res.json({
      message: 'Payout settings updated successfully',
      settings
    });

  } catch (error) {
    console.error('Payout Settings Error:', error);
    res.status(500).json({ 
      error: 'Failed to update payout settings',
      message: error.message 
    });
  }
});

/**
 * GET /api/payouts/history/:userId
 * Get user's payout history
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: payouts, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      payouts,
      total_paid: payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    });

  } catch (error) {
    console.error('Payout History Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payout history',
      message: error.message 
    });
  }
});

module.exports = router;
