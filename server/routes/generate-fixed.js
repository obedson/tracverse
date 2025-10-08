// routes/generate-fixed.js
const express = require('express');
const router = express.Router();

/**
 * POST /api/generate-url
 * Generate a tracking URL with UTM parameters
 */
router.post('/', async (req, res) => {
  try {
    const { original_url, user_id, base_url, platform } = req.body;

    // Accept either original_url or base_url
    const urlToProcess = original_url || base_url;
    const processUserId = user_id || 'test-user-' + Date.now();

    // Basic validation
    if (!urlToProcess) {
      return res.status(400).json({ 
        error: 'original_url or base_url is required' 
      });
    }

    // Simple URL validation
    try {
      new URL(urlToProcess);
    } catch {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    // Generate tracking URL (simplified)
    const trackingId = 'track_' + Date.now();
    const trackingUrl = `${urlToProcess}${urlToProcess.includes('?') ? '&' : '?'}utm_source=tracverse&utm_medium=${platform || 'web'}&utm_campaign=${processUserId}&tracking_id=${trackingId}`;

    res.json({
      success: true,
      original_url: urlToProcess,
      tracking_url: trackingUrl,
      tracking_id: trackingId,
      platform: platform || 'web'
    });

  } catch (error) {
    console.error('URL generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate tracking URL',
      details: error.message 
    });
  }
});

module.exports = router;
