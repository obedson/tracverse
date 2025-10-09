// routes/referrals.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-dev'); // Use mock auth for development
const { createClient } = require('@supabase/supabase-js');
const mlmService = require('../services/mlmService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /api/referrals
 * Get user's referral tree and statistics
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // First get the user's UUID from their user_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get direct referrals using the UUID
    const { data: directReferrals, error: referralsError } = await supabase
      .from('users')
      .select('id, email, referral_code, rank, total_earnings, active_status, created_at')
      .eq('sponsor_id', user.id);

    if (referralsError) {
      console.error('Referrals error:', referralsError);
      return res.status(500).json({ error: 'Failed to fetch referrals' });
    }

    // Get referral statistics
    const totalReferrals = directReferrals?.length || 0;
    const activeReferrals = directReferrals?.filter(r => r.active_status).length || 0;

    res.success({
      referrals: directReferrals || [],
      statistics: {
        total_referrals: totalReferrals,
        active_referrals: activeReferrals,
        inactive_referrals: totalReferrals - activeReferrals
      }
    }, 'Referrals retrieved successfully');

  } catch (error) {
    console.error('Referrals fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/referrals/stats
 * Get referral statistics for dashboard
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // First get the user's UUID from their user_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!user) {
      return res.json({ total_referrals: 0, active_referrals: 0, total_earnings: 0 });
    }

    const { data: referrals } = await supabase
      .from('users')
      .select('id, active_status, total_earnings')
      .eq('sponsor_id', user.id);

    const stats = {
      total_referrals: referrals?.length || 0,
      active_referrals: referrals?.filter(r => r.active_status).length || 0,
      total_earnings: referrals?.reduce((sum, r) => sum + (r.total_earnings || 0), 0) || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/referrals/register
 * Register new user with referral
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, sponsor_code } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists' 
      });
    }

    // Validate sponsor code if provided
    if (sponsor_code) {
      const validation = await mlmService.validateReferralCode(sponsor_code);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: validation.message 
        });
      }
    }

    // Register user with referral
    const userData = {
      email,
      password, // In production, hash this
      active_status: true
    };

    const result = await mlmService.registerWithReferral(userData, sponsor_code);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        referral_code: result.user.referral_code
      },
      sponsor: result.sponsor ? {
        id: result.sponsor.id,
        referral_code: result.sponsor.referral_code
      } : null,
      placement: result.placement
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
});

/**
 * GET /api/referrals/validate/:code
 * Validate referral code
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const validation = await mlmService.validateReferralCode(code);
    
    res.json(validation);

  } catch (error) {
    console.error('Validation Error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
});

/**
 * GET /api/referrals/tree/:userId
 * Get user's referral tree
 */
router.get('/tree/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { levels = 1 } = req.query;

    // Get downline
    const downline = await mlmService.getDownline(userId, parseInt(levels));
    
    // Get upline
    const upline = await mlmService.getUplineChain(userId, 5);
    
    // Get tree stats
    const stats = await mlmService.getTreeStats(userId);

    res.json({
      downline,
      upline,
      stats
    });

  } catch (error) {
    console.error('Tree Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch referral tree',
      message: error.message 
    });
  }
});

/**
 * GET /api/referrals/downline/:userId
 * Get user's direct downline
 */
router.get('/downline/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const downline = await mlmService.getDownline(userId, 1);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedDownline = downline.slice(startIndex, endIndex);

    res.json({
      data: paginatedDownline,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: downline.length,
        total_pages: Math.ceil(downline.length / limit)
      }
    });

  } catch (error) {
    console.error('Downline Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch downline',
      message: error.message 
    });
  }
});

/**
 * GET /api/referrals/stats
 * Get referral statistics for authenticated user
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Use proper MLM service with validation
    const stats = await mlmService.getTreeStats(userId);
    
    // Get user's referral code with validation
    const { data: user, error } = await supabase
      .from('users')
      .select('referral_code, rank, personal_volume, team_volume')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('User fetch error:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      referral_code: user?.referral_code,
      rank: user?.rank || 'Bronze',
      personal_volume: user?.personal_volume || 0,
      team_volume: user?.team_volume || 0,
      ...stats
    });

  } catch (error) {
    console.error('Stats Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

/**
 * GET /api/referrals/stats/:userId
 * Get referral statistics
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await mlmService.getTreeStats(userId);
    
    // Get user's referral code
    const { data: user } = await supabase
      .from('users')
      .select('referral_code, rank, personal_volume, team_volume')
      .eq('id', userId)
      .single();

    res.json({
      referral_code: user?.referral_code,
      rank: user?.rank,
      personal_volume: user?.personal_volume || 0,
      team_volume: user?.team_volume || 0,
      ...stats
    });

  } catch (error) {
    console.error('Stats Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

/**
 * GET /api/referrals/upline/:userId
 * Get user's upline chain
 */
router.get('/upline/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { levels = 5 } = req.query;

    const upline = await mlmService.getUplineChain(userId, parseInt(levels));

    res.json({
      upline,
      total_levels: upline.length
    });

  } catch (error) {
    console.error('Upline Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch upline',
      message: error.message 
    });
  }
});

/**
 * POST /api/referrals/link
 * Generate referral link for user
 */
router.post('/link', async (req, res) => {
  try {
    const { user_id, campaign = 'default' } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    // Get user's referral code
    const { data: user, error } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Generate referral link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/register?ref=${user.referral_code}&campaign=${campaign}`;

    res.json({
      referral_code: user.referral_code,
      referral_link: referralLink,
      campaign
    });

  } catch (error) {
    console.error('Link Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate referral link',
      message: error.message 
    });
  }
});

module.exports = router;
