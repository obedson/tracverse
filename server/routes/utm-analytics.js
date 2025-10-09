// routes/utm-analytics.js - Enhanced UTM Tracking & Analytics API
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * POST /api/utm-analytics/track
 * Track UTM campaign performance
 */
router.post('/track', async (req, res) => {
  try {
    const { 
      referral_code,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      action = 'click' // 'click' or 'conversion'
    } = req.body;

    if (!referral_code) {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    // Check if UTM tracking record exists
    const { data: existingUTM } = await supabase
      .from('utm_tracking')
      .select('*')
      .eq('referral_code', referral_code)
      .eq('utm_source', utm_source || '')
      .eq('utm_medium', utm_medium || '')
      .eq('utm_campaign', utm_campaign || '')
      .eq('utm_term', utm_term || '')
      .eq('utm_content', utm_content || '')
      .single();

    if (existingUTM) {
      // Update existing record
      const updateData = {};
      if (action === 'click') {
        updateData.clicks = existingUTM.clicks + 1;
      } else if (action === 'conversion') {
        updateData.conversions = existingUTM.conversions + 1;
      }

      const { error } = await supabase
        .from('utm_tracking')
        .update(updateData)
        .eq('id', existingUTM.id);

      if (error) {
        console.error('UTM tracking update error:', error);
        return res.status(500).json({ error: 'Failed to update UTM tracking' });
      }
    } else {
      // Create new UTM tracking record
      const insertData = {
        referral_code,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
        clicks: action === 'click' ? 1 : 0,
        conversions: action === 'conversion' ? 1 : 0
      };

      const { error } = await supabase
        .from('utm_tracking')
        .insert(insertData);

      if (error) {
        console.error('UTM tracking creation error:', error);
        return res.status(500).json({ error: 'Failed to create UTM tracking' });
      }
    }

    res.json({
      success: true,
      message: 'UTM tracking updated successfully',
      action,
      referral_code
    });

  } catch (error) {
    console.error('UTM tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/utm-analytics/campaigns/:referralCode
 * Get campaign performance for referral code
 */
router.get('/campaigns/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;

    // Get all UTM campaigns for this referral code
    const { data: campaigns, error } = await supabase
      .from('utm_tracking')
      .select('*')
      .eq('referral_code', referralCode)
      .order('clicks', { ascending: false });

    if (error) {
      console.error('Campaign fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }

    // Calculate totals and performance metrics
    const totalClicks = campaigns?.reduce((sum, c) => sum + c.clicks, 0) || 0;
    const totalConversions = campaigns?.reduce((sum, c) => sum + c.conversions, 0) || 0;
    const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0;

    // Add conversion rate to each campaign
    const campaignsWithMetrics = campaigns?.map(campaign => ({
      ...campaign,
      conversion_rate: campaign.clicks > 0 ? (campaign.conversions / campaign.clicks * 100).toFixed(2) : 0,
      performance_score: campaign.clicks * 0.3 + campaign.conversions * 0.7 // Weighted score
    })) || [];

    // Group by source and medium
    const sourceBreakdown = campaigns?.reduce((acc, campaign) => {
      const source = campaign.utm_source || 'direct';
      if (!acc[source]) acc[source] = { clicks: 0, conversions: 0 };
      acc[source].clicks += campaign.clicks;
      acc[source].conversions += campaign.conversions;
      return acc;
    }, {}) || {};

    const mediumBreakdown = campaigns?.reduce((acc, campaign) => {
      const medium = campaign.utm_medium || 'none';
      if (!acc[medium]) acc[medium] = { clicks: 0, conversions: 0 };
      acc[medium].clicks += campaign.clicks;
      acc[medium].conversions += campaign.conversions;
      return acc;
    }, {}) || {};

    res.json({
      referral_code: referralCode,
      summary: {
        total_campaigns: campaigns?.length || 0,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        overall_conversion_rate: parseFloat(overallConversionRate)
      },
      campaigns: campaignsWithMetrics,
      breakdowns: {
        by_source: sourceBreakdown,
        by_medium: mediumBreakdown
      }
    });

  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/utm-analytics/performance/:referralCode
 * Get detailed performance analytics
 */
router.get('/performance/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;
    const { period = '30' } = req.query; // days

    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();

    // Get UTM tracking data
    const { data: utmData } = await supabase
      .from('utm_tracking')
      .select('*')
      .eq('referral_code', referralCode)
      .gte('created_at', startDate);

    // Get referral analytics data for comparison
    const { data: referralData } = await supabase
      .from('referral_analytics')
      .select('*')
      .eq('referral_code', referralCode)
      .gte('clicked_at', startDate);

    // Calculate performance metrics
    const utmClicks = utmData?.reduce((sum, u) => sum + u.clicks, 0) || 0;
    const utmConversions = utmData?.reduce((sum, u) => sum + u.conversions, 0) || 0;
    const directClicks = referralData?.length || 0;
    const directConversions = referralData?.filter(r => r.converted).length || 0;

    // Top performing campaigns
    const topCampaigns = utmData?.sort((a, b) => {
      const scoreA = a.clicks * 0.3 + a.conversions * 0.7;
      const scoreB = b.clicks * 0.3 + b.conversions * 0.7;
      return scoreB - scoreA;
    }).slice(0, 5) || [];

    // Campaign comparison
    const campaignComparison = utmData?.map(campaign => ({
      campaign_name: campaign.utm_campaign || 'Unnamed Campaign',
      source: campaign.utm_source,
      medium: campaign.utm_medium,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      conversion_rate: campaign.clicks > 0 ? (campaign.conversions / campaign.clicks * 100).toFixed(2) : 0,
      cost_per_conversion: campaign.conversions > 0 ? (campaign.clicks / campaign.conversions).toFixed(2) : 'N/A'
    })) || [];

    res.json({
      referral_code: referralCode,
      period_days: parseInt(period),
      performance_summary: {
        utm_tracked: {
          clicks: utmClicks,
          conversions: utmConversions,
          conversion_rate: utmClicks > 0 ? (utmConversions / utmClicks * 100).toFixed(2) : 0
        },
        direct_tracking: {
          clicks: directClicks,
          conversions: directConversions,
          conversion_rate: directClicks > 0 ? (directConversions / directClicks * 100).toFixed(2) : 0
        },
        total: {
          clicks: utmClicks + directClicks,
          conversions: utmConversions + directConversions,
          conversion_rate: (utmClicks + directClicks) > 0 ? 
            ((utmConversions + directConversions) / (utmClicks + directClicks) * 100).toFixed(2) : 0
        }
      },
      top_campaigns: topCampaigns,
      campaign_comparison: campaignComparison
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/utm-analytics/funnel/:referralCode
 * Get referral funnel analytics
 */
router.get('/funnel/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;

    // Get funnel data from referral analytics
    const { data: funnelData } = await supabase
      .from('referral_analytics')
      .select('click_source, utm_source, utm_medium, utm_campaign, converted, clicked_at, converted_at')
      .eq('referral_code', referralCode)
      .order('clicked_at', { ascending: false });

    // Calculate funnel metrics
    const totalClicks = funnelData?.length || 0;
    const conversions = funnelData?.filter(f => f.converted).length || 0;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks * 100).toFixed(2) : 0;

    // Funnel by source
    const funnelBySource = funnelData?.reduce((acc, item) => {
      const source = item.utm_source || item.click_source || 'direct';
      if (!acc[source]) {
        acc[source] = { clicks: 0, conversions: 0, conversion_rate: 0 };
      }
      acc[source].clicks += 1;
      if (item.converted) acc[source].conversions += 1;
      acc[source].conversion_rate = acc[source].clicks > 0 ? 
        (acc[source].conversions / acc[source].clicks * 100).toFixed(2) : 0;
      return acc;
    }, {}) || {};

    // Time to conversion analysis
    const conversionTimes = funnelData?.filter(f => f.converted && f.converted_at && f.clicked_at)
      .map(f => {
        const clickTime = new Date(f.clicked_at);
        const convertTime = new Date(f.converted_at);
        return Math.round((convertTime - clickTime) / (1000 * 60)); // minutes
      }) || [];

    const avgConversionTime = conversionTimes.length > 0 ? 
      Math.round(conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length) : 0;

    res.json({
      referral_code: referralCode,
      funnel_overview: {
        total_clicks: totalClicks,
        conversions,
        conversion_rate: parseFloat(conversionRate),
        drop_off_rate: (100 - parseFloat(conversionRate)).toFixed(2)
      },
      funnel_by_source: funnelBySource,
      conversion_timing: {
        average_time_to_convert_minutes: avgConversionTime,
        conversion_times_distribution: conversionTimes.length > 0 ? {
          under_5_min: conversionTimes.filter(t => t < 5).length,
          under_30_min: conversionTimes.filter(t => t < 30).length,
          under_60_min: conversionTimes.filter(t => t < 60).length,
          over_60_min: conversionTimes.filter(t => t >= 60).length
        } : {}
      },
      recent_activity: funnelData?.slice(0, 10) || []
    });

  } catch (error) {
    console.error('Funnel analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
