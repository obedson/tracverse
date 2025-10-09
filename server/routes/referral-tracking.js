// routes/referral-tracking.js - Referral Click Tracking API
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * POST /api/referral-tracking/click
 * Track referral link clicks
 */
router.post('/click', async (req, res) => {
  try {
    const { 
      referral_code, 
      click_source = 'direct',
      utm_source,
      utm_medium, 
      utm_campaign,
      ip_address,
      user_agent 
    } = req.body;

    if (!referral_code) {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    // Verify referral code exists and get the auth user ID
    const { data: user } = await supabase
      .from('users')
      .select('user_id, referral_code')  // user_id is the auth.users.id
      .eq('referral_code', referral_code)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Track the click (user_id should reference auth.users.id)
    const { data: clickRecord, error } = await supabase
      .from('referral_analytics')
      .insert({
        referral_code,
        user_id: user.user_id,  // This is the auth.users.id
        click_source,
        ip_address,
        user_agent,
        utm_source,
        utm_medium,
        utm_campaign,
        clicked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Click tracking error:', error);
      return res.status(500).json({ error: 'Failed to track click' });
    }

    res.json({
      success: true,
      message: 'Click tracked successfully',
      click_id: clickRecord.id,
      referral_code,
      timestamp: clickRecord.clicked_at
    });

  } catch (error) {
    console.error('Referral click tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/referral-tracking/stats/:referralCode
 * Get referral click statistics
 */
router.get('/stats/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;
    const { period = '30' } = req.query; // days

    // Get click statistics
    const { data: clickStats } = await supabase
      .from('referral_analytics')
      .select('*')
      .eq('referral_code', referralCode)
      .gte('clicked_at', new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString());

    const totalClicks = clickStats?.length || 0;
    const conversions = clickStats?.filter(c => c.converted).length || 0;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks * 100).toFixed(2) : 0;

    // Group by source
    const sourceBreakdown = clickStats?.reduce((acc, click) => {
      const source = click.click_source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      referral_code: referralCode,
      period_days: parseInt(period),
      statistics: {
        total_clicks: totalClicks,
        conversions,
        conversion_rate: parseFloat(conversionRate),
        source_breakdown: sourceBreakdown
      },
      recent_clicks: clickStats?.slice(-10) || []
    });

  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ error: 'Failed to fetch referral statistics' });
  }
});

/**
 * POST /api/referral-tracking/convert
 * Mark a referral as converted (when user registers)
 */
router.post('/convert', async (req, res) => {
  try {
    const { referral_code, converted_user_id, referral_source } = req.body;

    if (!referral_code || !converted_user_id) {
      return res.status(400).json({ 
        error: 'Referral code and converted user ID are required' 
      });
    }

    // Update the most recent unconverted click for this referral code
    const { data: updatedClick, error } = await supabase
      .from('referral_analytics')
      .update({
        converted: true,
        converted_user_id,
        converted_at: new Date().toISOString()
      })
      .eq('referral_code', referral_code)
      .eq('converted', false)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .select();

    if (error) {
      console.error('Conversion tracking error:', error);
      return res.status(500).json({ error: 'Failed to track conversion' });
    }

    res.json({
      success: true,
      message: 'Conversion tracked successfully',
      converted_clicks: updatedClick?.length || 0
    });

  } catch (error) {
    console.error('Referral conversion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
