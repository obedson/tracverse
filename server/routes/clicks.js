// routes/clicks.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const mlmService = require('../services/mlmService');

/**
 * GET /api/clicks
 * Get paginated click logs with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { 
      user_id, 
      platform, 
      page = 1, 
      limit = 50,
      start_date,
      end_date
    } = req.query;

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('link_clicks')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(from, to);

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (start_date) {
      query = query.gte('timestamp', start_date);
    }

    if (end_date) {
      query = query.lte('timestamp', end_date);
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching clicks:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch click logs' 
      });
    }

    // Return paginated results
    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error in clicks route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
/**
 * POST /api/clicks/track
 * Track a click and process MLM commissions
 */
router.post('/track', async (req, res) => {
  try {
    const { user_id, original_url, modified_url, tracking_id, platform = 'unknown' } = req.body;

    if (!user_id || !original_url) {
      return res.status(400).json({ error: 'user_id and original_url are required' });
    }

    // Record the click
    const { data: click, error: clickError } = await supabase
      .from('link_clicks')
      .insert({
        user_id,
        original_url,
        modified_url: modified_url || original_url,
        tracking_id: tracking_id || `track_${Date.now()}`,
        platform
      })
      .select()
      .single();

    if (clickError) throw clickError;

    // Process MLM commissions (1 point per click)
    const points = 1;
    const commissionResult = await mlmService.processTaskCompletion(user_id, points);

    res.json({
      message: 'Click tracked successfully',
      click,
      mlm: {
        points_earned: points,
        commissions_created: commissionResult.commissions.length
      }
    });

  } catch (error) {
    console.error('Click tracking error:', error);
    res.status(500).json({ 
      error: 'Failed to track click',
      message: error.message 
    });
  }
});
