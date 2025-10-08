// routes/generate-compliant.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Simple pseudonymization function
function pseudonymizeUserId(userId) {
  return 'anon_' + Buffer.from(userId).toString('base64').substr(0, 8);
}

// Simple URL validation
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// Simple tracking URL builder
function buildTrackingUrl(originalUrl, utmConfig) {
  const trackingId = 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const separator = originalUrl.includes('?') ? '&' : '?';
  
  const utmParams = [
    `utm_source=${encodeURIComponent(utmConfig.utm_source || 'tracverse')}`,
    `utm_medium=${encodeURIComponent(utmConfig.utm_medium || 'web')}`,
    `utm_campaign=${encodeURIComponent(utmConfig.utm_campaign || utmConfig.utm_campaign_prefix || 'default')}`,
    `tracking_id=${trackingId}`
  ].join('&');

  return {
    modified_url: `${originalUrl}${separator}${utmParams}`,
    tracking_id: trackingId
  };
}

/**
 * POST /api/generate-url
 * Generate a tracking URL with UTM parameters (Standards Compliant)
 */
router.post('/', async (req, res) => {
  try {
    const { original_url, user_id, base_url, platform } = req.body;

    // Accept either parameter name
    const urlToProcess = original_url || base_url;
    let processUserId = user_id || 'test-user-' + Date.now();

    // Validate required fields
    if (!urlToProcess) {
      return res.status(400).json({ 
        error: 'original_url or base_url is required' 
      });
    }

    // Validate URL format
    if (!isValidUrl(urlToProcess)) {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    // Get UTM config from database with fallback
    let utmConfig;
    try {
      const { data, error } = await supabase
        .from('utm_configs')
        .select('*')
        .eq('is_default', true)
        .limit(1);

      if (error || !data || data.length === 0) {
        // Fallback UTM config
        utmConfig = {
          utm_source: 'tracverse',
          utm_medium: platform || 'web',
          utm_campaign: 'default'
        };
      } else {
        utmConfig = data[0];
      }
    } catch (dbError) {
      // Fallback on database error
      utmConfig = {
        utm_source: 'tracverse',
        utm_medium: platform || 'web',
        utm_campaign: 'default'
      };
    }

    // Build tracking URL
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
      tracking_id
    });

  } catch (error) {
    console.error('URL generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate tracking URL' 
    });
  }
});

module.exports = router;
