// routes/referral-dashboard.js - Real-time Referral Stats Dashboard API
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /api/referral-dashboard/:referralCode
 * Get comprehensive real-time referral dashboard data
 */
router.get('/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;
    const { period = '30' } = req.query; // days

    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('user_id, email, referral_code, rank, total_earnings')
      .eq('referral_code', referralCode)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Get referral analytics (clicks and conversions)
    const { data: referralAnalytics } = await supabase
      .from('referral_analytics')
      .select('*')
      .eq('referral_code', referralCode)
      .gte('clicked_at', startDate);

    // Get UTM tracking data
    const { data: utmData } = await supabase
      .from('utm_tracking')
      .select('*')
      .eq('referral_code', referralCode);

    // Get actual referrals (users who signed up)
    const { data: actualReferrals } = await supabase
      .from('users')
      .select('email, referral_code, created_at, rank, total_earnings')
      .eq('referred_by_code', referralCode)
      .gte('created_at', startDate);

    // Calculate real-time metrics
    const totalClicks = referralAnalytics?.length || 0;
    const totalConversions = referralAnalytics?.filter(r => r.converted).length || 0;
    const actualSignups = actualReferrals?.length || 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0;
    const signupRate = totalClicks > 0 ? (actualSignups / totalClicks * 100).toFixed(2) : 0;

    // UTM performance summary
    const utmClicks = utmData?.reduce((sum, u) => sum + u.clicks, 0) || 0;
    const utmConversions = utmData?.reduce((sum, u) => sum + u.conversions, 0) || 0;

    // Click sources breakdown
    const sourceBreakdown = referralAnalytics?.reduce((acc, item) => {
      const source = item.utm_source || item.click_source || 'direct';
      if (!acc[source]) acc[source] = { clicks: 0, conversions: 0 };
      acc[source].clicks += 1;
      if (item.converted) acc[source].conversions += 1;
      return acc;
    }, {}) || {};

    // Recent activity (last 10 clicks)
    const recentActivity = referralAnalytics?.slice(-10).reverse().map(activity => ({
      timestamp: activity.clicked_at,
      source: activity.utm_source || activity.click_source || 'direct',
      medium: activity.utm_medium || 'unknown',
      campaign: activity.utm_campaign || 'none',
      converted: activity.converted,
      conversion_time: activity.converted_at
    })) || [];

    // Performance trends (daily breakdown for last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyTrends = last7Days.map(date => {
      const dayClicks = referralAnalytics?.filter(r => 
        r.clicked_at.startsWith(date)
      ).length || 0;
      const dayConversions = referralAnalytics?.filter(r => 
        r.converted && r.converted_at?.startsWith(date)
      ).length || 0;
      
      return {
        date,
        clicks: dayClicks,
        conversions: dayConversions,
        conversion_rate: dayClicks > 0 ? (dayConversions / dayClicks * 100).toFixed(2) : 0
      };
    });

    // Top performing campaigns
    const topCampaigns = utmData?.sort((a, b) => {
      const scoreA = a.clicks * 0.3 + a.conversions * 0.7;
      const scoreB = b.clicks * 0.3 + b.conversions * 0.7;
      return scoreB - scoreA;
    }).slice(0, 3).map(campaign => ({
      name: campaign.utm_campaign || 'Unnamed',
      source: campaign.utm_source,
      medium: campaign.utm_medium,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      conversion_rate: campaign.clicks > 0 ? (campaign.conversions / campaign.clicks * 100).toFixed(2) : 0
    })) || [];

    res.json({
      user_info: {
        email: user.email,
        referral_code: referralCode,
        rank: user.rank,
        total_earnings: user.total_earnings || 0
      },
      period_days: parseInt(period),
      real_time_stats: {
        total_clicks: totalClicks + utmClicks,
        total_conversions: totalConversions + utmConversions,
        actual_signups: actualSignups,
        conversion_rate: parseFloat(conversionRate),
        signup_rate: parseFloat(signupRate),
        click_to_signup_ratio: totalClicks > 0 ? (actualSignups / totalClicks).toFixed(2) : 0
      },
      tracking_breakdown: {
        direct_tracking: {
          clicks: totalClicks,
          conversions: totalConversions,
          conversion_rate: parseFloat(conversionRate)
        },
        utm_tracking: {
          clicks: utmClicks,
          conversions: utmConversions,
          conversion_rate: utmClicks > 0 ? (utmConversions / utmClicks * 100).toFixed(2) : 0
        }
      },
      source_performance: sourceBreakdown,
      recent_activity: recentActivity,
      daily_trends: dailyTrends,
      top_campaigns: topCampaigns,
      actual_referrals: actualReferrals?.map(ref => ({
        email: ref.email,
        referral_code: ref.referral_code,
        signup_date: ref.created_at,
        rank: ref.rank,
        earnings: ref.total_earnings || 0
      })) || []
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/referral-dashboard/:referralCode/live-stats
 * Get live referral statistics (lightweight for frequent polling)
 */
router.get('/:referralCode/live-stats', async (req, res) => {
  try {
    const { referralCode } = req.params;

    // Get today's stats only for real-time updates
    const today = new Date().toISOString().split('T')[0];

    const { data: todayClicks } = await supabase
      .from('referral_analytics')
      .select('converted')
      .eq('referral_code', referralCode)
      .gte('clicked_at', today + 'T00:00:00.000Z');

    const { data: utmToday } = await supabase
      .from('utm_tracking')
      .select('clicks, conversions')
      .eq('referral_code', referralCode);

    const totalTodayClicks = (todayClicks?.length || 0) + 
      (utmToday?.reduce((sum, u) => sum + u.clicks, 0) || 0);
    const totalTodayConversions = (todayClicks?.filter(c => c.converted).length || 0) + 
      (utmToday?.reduce((sum, u) => sum + u.conversions, 0) || 0);

    // Get total all-time stats
    const { data: allTimeClicks } = await supabase
      .from('referral_analytics')
      .select('converted')
      .eq('referral_code', referralCode);

    const { data: allTimeUTM } = await supabase
      .from('utm_tracking')
      .select('clicks, conversions')
      .eq('referral_code', referralCode);

    const totalAllTimeClicks = (allTimeClicks?.length || 0) + 
      (allTimeUTM?.reduce((sum, u) => sum + u.clicks, 0) || 0);
    const totalAllTimeConversions = (allTimeClicks?.filter(c => c.converted).length || 0) + 
      (allTimeUTM?.reduce((sum, u) => sum + u.conversions, 0) || 0);

    res.json({
      referral_code: referralCode,
      timestamp: new Date().toISOString(),
      today: {
        clicks: totalTodayClicks,
        conversions: totalTodayConversions,
        conversion_rate: totalTodayClicks > 0 ? 
          (totalTodayConversions / totalTodayClicks * 100).toFixed(2) : 0
      },
      all_time: {
        clicks: totalAllTimeClicks,
        conversions: totalAllTimeConversions,
        conversion_rate: totalAllTimeClicks > 0 ? 
          (totalAllTimeConversions / totalAllTimeClicks * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Live stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/referral-dashboard/:referralCode/conversion-funnel
 * Get detailed conversion funnel analysis
 */
router.get('/:referralCode/conversion-funnel', async (req, res) => {
  try {
    const { referralCode } = req.params;
    const { period = '30' } = req.query;

    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();

    // Get funnel data
    const { data: funnelData } = await supabase
      .from('referral_analytics')
      .select('*')
      .eq('referral_code', referralCode)
      .gte('clicked_at', startDate)
      .order('clicked_at', { ascending: true });

    // Get actual signups
    const { data: signups } = await supabase
      .from('users')
      .select('created_at, referred_by_code')
      .eq('referred_by_code', referralCode)
      .gte('created_at', startDate);

    const totalClicks = funnelData?.length || 0;
    const trackedConversions = funnelData?.filter(f => f.converted).length || 0;
    const actualSignups = signups?.length || 0;

    // Funnel stages
    const funnelStages = {
      stage_1_clicks: totalClicks,
      stage_2_tracked_conversions: trackedConversions,
      stage_3_actual_signups: actualSignups,
      drop_off_1_to_2: totalClicks > 0 ? 
        (((totalClicks - trackedConversions) / totalClicks) * 100).toFixed(2) : 0,
      drop_off_2_to_3: trackedConversions > 0 ? 
        (((trackedConversions - actualSignups) / trackedConversions) * 100).toFixed(2) : 0,
      overall_conversion_rate: totalClicks > 0 ? 
        ((actualSignups / totalClicks) * 100).toFixed(2) : 0
    };

    // Conversion paths analysis
    const conversionPaths = funnelData?.filter(f => f.converted).map(f => ({
      source: f.utm_source || f.click_source || 'direct',
      medium: f.utm_medium || 'unknown',
      campaign: f.utm_campaign || 'none',
      click_time: f.clicked_at,
      conversion_time: f.converted_at,
      time_to_convert_minutes: f.converted_at && f.clicked_at ? 
        Math.round((new Date(f.converted_at) - new Date(f.clicked_at)) / (1000 * 60)) : null
    })) || [];

    res.json({
      referral_code: referralCode,
      period_days: parseInt(period),
      funnel_stages: funnelStages,
      conversion_paths: conversionPaths,
      funnel_visualization: {
        clicks: totalClicks,
        tracked_conversions: trackedConversions,
        actual_signups: actualSignups,
        click_to_conversion_rate: totalClicks > 0 ? 
          ((trackedConversions / totalClicks) * 100).toFixed(2) : 0,
        conversion_to_signup_rate: trackedConversions > 0 ? 
          ((actualSignups / trackedConversions) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Conversion funnel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
