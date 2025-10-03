// routes/generate.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { buildTrackingUrl, isValidUrl } = require('../utils/urlBuilder');
const { pseudonymizeUserId } = require('../utils/idGenerator');

/**
 * POST /api/generate-url
 * Generate a tracking URL with UTM parameters
 */
router.post('/', async (req, res) => {
  try {
    const { original_url, user_id, platform } = req.body;

    // Validate required fields
    if (!original_url) {
      return res.status(400).json({ 
        error: 'original_url is required' 
      });
    }

    if (!user_id) {
      return res.status(400).json({ 
        error: 'user_id is required' 
      });
    }

    // Validate URL format
    if (!isValidUrl(original_url)) {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    // Get active UTM config from Supabase
    const { data: utmConfig, error: configError } = await supabase
      .from('utm_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !utmConfig) {
      return res.status(500).json({ 
        error: 'No active UTM configuration found' 
      });
    }

    // Build tracking URL
    const { modified_url, tracking_id } = buildTrackingUrl(original_url, utmConfig);

    // Pseudonymize user_id if enabled in env
    const shouldPseudonymize = process.env.PSEUDONYMIZE_USERS === 'true';
    const storedUserId = shouldPseudonymize 
      ? pseudonymizeUserId(user_id) 
      : user_id;

    // Log click event to Supabase
    const { error: insertError } = await supabase
      .from('link_clicks')
      .insert({
        user_id: storedUserId,
        original_url,
        modified_url,
        tracking_id,
        platform: platform || 'unknown'
      });

    if (insertError) {
      console.error('Error logging click:', insertError);
      return res.status(500).json({ 
        error: 'Failed to log click event' 
      });
    }

    // Return modified URL
    res.json({
      modified_url,
      tracking_id
    });

  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
