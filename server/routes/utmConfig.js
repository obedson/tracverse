// routes/utmConfig.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { validateUtmConfig } = require('../utils/urlBuilder');

/**
 * GET /api/utm-config
 * Get the active UTM configuration
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('utm_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching UTM config:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch UTM configuration' 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        error: 'No active UTM configuration found' 
      });
    }

    res.json(data);

  } catch (error) {
    console.error('Error in utm-config GET:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * POST /api/utm-config
 * Create a new UTM configuration and set it as active
 */
router.post('/', async (req, res) => {
  try {
    const { utm_source, utm_medium, utm_campaign_prefix } = req.body;

    // Validate input
    const validation = validateUtmConfig({ 
      utm_source, 
      utm_medium, 
      utm_campaign_prefix 
    });

    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Deactivate all existing configs
    const { error: deactivateError } = await supabase
      .from('utm_config')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating configs:', deactivateError);
      return res.status(500).json({ 
        error: 'Failed to update existing configurations' 
      });
    }

    // Insert new config as active
    const { data, error: insertError } = await supabase
      .from('utm_config')
      .insert({
        utm_source,
        utm_medium,
        utm_campaign_prefix,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting UTM config:', insertError);
      return res.status(500).json({ 
        error: 'Failed to create UTM configuration' 
      });
    }

    res.status(201).json({
      message: 'UTM configuration updated successfully',
      data
    });

  } catch (error) {
    console.error('Error in utm-config POST:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * GET /api/utm-config/all
 * Get all UTM configurations (including inactive ones)
 */
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('utm_config')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all UTM configs:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch UTM configurations' 
      });
    }

    res.json(data);

  } catch (error) {
    console.error('Error in utm-config/all GET:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
