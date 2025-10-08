// routes/generate-proper.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { buildTrackingUrl, isValidUrl } = require('../utils/urlBuilder');
const { pseudonymizeUserId } = require('../utils/idGenerator');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * POST /api/generate-url
 * Generate a tracking URL with UTM parameters
 */
router.post('/', async (req, res) => {
  try {
    const { original_url, user_id, base_url, platform } = req.body;

    // Accept either parameter name for flexibility
    const urlToProcess = original_url || base_url;
    const processUserId = user_id || 'test-user-' + Date.now();

    // Validate required fields
    if (!urlToProcess) {
      return res.status(400).json({ 
        error: 'original_url is required' 
      });
    }

    // Validate URL format
    if (!isValidUrl(urlToProcess)) {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    // Get active UTM config from Supabase (with fallback)
    let utmConfig;
    try {
      const { data, error: configError } = await supabase
        .from('utm_configs')
        .select('*')
        .eq('is_default', true)
        .limit(1);

      if (configError || !data || data.length === 0) {
        // Fallback UTM config
        utmConfig = {
          utm_source: 'tracverse',
          utm_medium: platform || 'web',
          utm_campaign: 'default',
          utm_content: processUserId
        };
      } else {
        utmConfig = data[0];
      }
    } catch (error) {
      // Fallback UTM config
      utmConfig = {
        utm_source: 'tracverse',
        utm_medium: platform || 'web', 
        utm_campaign: 'default',
        utm_content: processUserId
      };
    }

    // Build tracking URL using proper utility
    const { modified_url, tracking_id } = buildTrackingUrl(urlToProcess, utmConfig);

    // Pseudonymize user_id if enabled
    const shouldPseudonymize = process.env.PSEUDONYMIZE_USERS === 'true';
    const storedUserId = shouldPseudonymize 
      ? pseudonymizeUserId(processUserId) 
      : processUserId;

    // Log click event to Supabase (graceful failure)
    try {
      await supabase
        .from('link_clicks')
        .insert({
          user_id: storedUserId,
          original_url: urlToProcess,
          modified_url,
          tracking_id,
          platform: platform || 'web'
        });
    } catch (insertError) {
      console.warn('Click logging failed (non-critical):', insertError.message);
      // Continue execution - logging failure shouldn't break URL generation
    }

    // Return in standard format
    res.json({
      modified_url,
      tracking_id,
      original_url: urlToProcess
    });

  } catch (error) {
    console.error('URL generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate tracking URL' 
    });
  }
});

module.exports = router;
