// routes/qualifications.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-enterprise');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /api/qualifications
 * Get user's rank qualifications and progress
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: qualifications, error: qualificationsError } = await supabase
      .from('user_qualifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (qualificationsError) {
      return res.status(500).json({ error: 'Failed to fetch qualifications' });
    }

    // Calculate progress statistics
    const totalQualifications = qualifications?.length || 0;
    const metQualifications = qualifications?.filter(q => q.status === 'met').length || 0;
    const inProgressQualifications = qualifications?.filter(q => q.status === 'in_progress').length || 0;

    res.success({
      qualifications: qualifications || [],
      statistics: {
        total_qualifications: totalQualifications,
        met_qualifications: metQualifications,
        in_progress_qualifications: inProgressQualifications,
        completion_rate: totalQualifications > 0 ? ((metQualifications / totalQualifications) * 100).toFixed(1) : 0
      }
    }, 'Qualifications retrieved successfully');

  } catch (error) {
    console.error('Qualifications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/qualifications/process
 * Process monthly qualifications for all users
 */
router.post('/process', async (req, res) => {
  try {
    const { period } = req.body;
    
    const qualifications = await mlmService.processMonthlyQualifications(period);

    res.json({
      message: 'Monthly qualifications processed successfully',
      period: period || new Date().toISOString().slice(0, 7),
      users_processed: qualifications.length,
      qualifications
    });

  } catch (error) {
    console.error('Qualifications Processing Error:', error);
    res.status(500).json({ 
      error: 'Failed to process qualifications',
      message: error.message 
    });
  }
});

/**
 * GET /api/qualifications/history/:userId
 * Get user's qualification history
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: qualifications, error } = await supabase
      .from('rank_qualifications')
      .select('*')
      .eq('user_id', userId)
      .order('period', { ascending: false });

    if (error) throw error;

    res.json({
      qualifications,
      total_periods: qualifications.length
    });

  } catch (error) {
    console.error('Qualification History Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch qualification history',
      message: error.message 
    });
  }
});

module.exports = router;
