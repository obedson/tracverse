const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// POST /api/compliance/cooling-off - Start cooling-off period
router.post('/cooling-off', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const coolingOffEnd = new Date();
    coolingOffEnd.setDate(coolingOffEnd.getDate() + 3); // 3-day cooling-off

    const { data } = await supabase
      .from('users')
      .update({ 
        cooling_off_end: coolingOffEnd.toISOString(),
        can_earn_commissions: false 
      })
      .eq('id', user_id)
      .select()
      .single();

    res.json({ 
      message: 'Cooling-off period started',
      cooling_off_end: coolingOffEnd,
      user: data 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/compliance/income-disclosure - Generate income disclosure
router.get('/income-disclosure', async (req, res) => {
  try {
    const { data: earnings } = await supabase
      .from('commissions')
      .select('user_id, amount')
      .eq('status', 'paid');

    const userEarnings = earnings?.reduce((acc, e) => {
      acc[e.user_id] = (acc[e.user_id] || 0) + parseFloat(e.amount);
      return acc;
    }, {}) || {};

    const earningsArray = Object.values(userEarnings);
    const totalUsers = earningsArray.length;
    
    const disclosure = {
      total_participants: totalUsers,
      average_earnings: earningsArray.reduce((sum, e) => sum + e, 0) / totalUsers || 0,
      median_earnings: earningsArray.sort()[Math.floor(totalUsers / 2)] || 0,
      top_10_percent: earningsArray.slice(-Math.ceil(totalUsers * 0.1)).reduce((sum, e) => sum + e, 0) / Math.ceil(totalUsers * 0.1) || 0,
      zero_earnings: totalUsers - earningsArray.filter(e => e > 0).length,
      generated_at: new Date().toISOString()
    };

    res.json(disclosure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/compliance/user-status/:userId - Check compliance status
router.get('/user-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user } = await supabase
      .from('users')
      .select('cooling_off_end, can_earn_commissions, kyc_status')
      .eq('id', userId)
      .single();

    const now = new Date();
    const coolingOffEnd = user?.cooling_off_end ? new Date(user.cooling_off_end) : null;
    const isCoolingOff = coolingOffEnd && now < coolingOffEnd;

    res.json({
      user_id: userId,
      kyc_completed: user?.kyc_status === 'approved',
      cooling_off_active: isCoolingOff,
      cooling_off_end: user?.cooling_off_end,
      can_earn_commissions: user?.can_earn_commissions && !isCoolingOff,
      compliance_status: user?.kyc_status === 'approved' && !isCoolingOff ? 'compliant' : 'pending'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
