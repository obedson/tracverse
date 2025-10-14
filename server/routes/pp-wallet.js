const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-enterprise');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Get user's PP wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('total_pp, available_pp, pending_pp, purchased_pp, earned_pp')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return res.success({
        totalPP: 0,
        availablePP: 0,
        pendingPP: 0,
        purchasedPP: 0,
        earnedPP: 0,
        conversionRate: 25
      });
    }

    res.success({
      totalPP: parseFloat(user.total_pp || 0),
      availablePP: parseFloat(user.available_pp || 0),
      pendingPP: parseFloat(user.pending_pp || 0),
      purchasedPP: parseFloat(user.purchased_pp || 0),
      earnedPP: parseFloat(user.earned_pp || 0),
      conversionRate: 25
    });
  } catch (error) {
    console.error('PP balance error:', error);
    res.error('Failed to fetch PP balance', 500);
  }
});

module.exports = router;
