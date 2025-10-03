// routes/clicks.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

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
