// routes/generate-simple.js
const express = require('express');
const router = express.Router();

/**
 * POST /api/generate-url
 * Generate a tracking URL with UTM parameters
 */
router.post('/', async (req, res) => {
  try {
    const { original_url, user_id, base_url, platform } = req.body;

    // Accept either parameter name
    const urlToProcess = original_url || base_url;
    const processUserId = user_id || 'test-user-' + Date.now();

    // Validate required fields
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

    // Generate simple tracking URL
    const trackingId = 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const separator = urlToProcess.includes('?') ? '&' : '?';
    const modified_url = `${urlToProcess}${separator}utm_source=tracverse&utm_medium=${platform || 'web'}&utm_campaign=default&tracking_id=${trackingId}`;

    // Return in expected format
    res.json({
      modified_url,
      tracking_id: trackingId
    });

  } catch (error) {
    console.error('URL generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate tracking URL' 
    });
  }
});

module.exports = router;
