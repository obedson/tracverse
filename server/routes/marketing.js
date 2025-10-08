// routes/marketing.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /api/marketing
 * Get marketing materials for user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, type } = req.query;

    let query = supabase
      .from('marketing_materials')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) query = query.eq('category', category);
    if (type) query = query.eq('type', type);

    const { data: materials, error: materialsError } = await query;

    if (materialsError) {
      return res.status(500).json({ error: 'Failed to fetch marketing materials' });
    }

    // Group by category
    const categorized = (materials || []).reduce((acc, material) => {
      const cat = material.category || 'uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(material);
      return acc;
    }, {});

    res.success({
      materials: materials || [],
      categorized,
      statistics: {
        total_materials: materials?.length || 0,
        user_materials: materials?.filter(m => m.user_id === userId).length || 0,
        public_materials: materials?.filter(m => m.is_public).length || 0
      }
    }, 'Marketing materials retrieved successfully');

  } catch (error) {
    console.error('Marketing materials fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/marketing/library/:userId
 * Get marketing materials library for user
 */
router.get('/library/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category } = req.query;

    const library = await mlmService.getMarketingLibrary(userId, category);

    res.json(library);

  } catch (error) {
    console.error('Marketing Library Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch marketing library',
      message: error.message 
    });
  }
});

/**
 * POST /api/marketing/create-landing-page
 * Create custom referral landing page
 */
router.post('/create-landing-page', async (req, res) => {
  try {
    const { user_id, page_data } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const landingPage = await mlmService.createReferralLandingPage(user_id, page_data || {});

    res.json({
      message: 'Landing page created successfully',
      landing_page: landingPage
    });

  } catch (error) {
    console.error('Landing Page Creation Error:', error);
    res.status(500).json({ 
      error: 'Failed to create landing page',
      message: error.message 
    });
  }
});

/**
 * GET /api/marketing/landing-analytics/:userId
 * Get landing page analytics
 */
router.get('/landing-analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const analytics = await mlmService.getLandingPageAnalytics(userId);

    res.json(analytics);

  } catch (error) {
    console.error('Landing Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch landing page analytics',
      message: error.message 
    });
  }
});

/**
 * GET /api/marketing/share-links/:userId
 * Generate social sharing links for user
 */
router.get('/share-links/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's referral code
    const { data: user } = await supabase
      .from('users')
      .select('referral_code, email')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralUrl = `${baseUrl}/register?ref=${user.referral_code}`;
    
    // Generate social sharing URLs
    const shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent('Join me on Tracverse and start earning!')}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Join me on Tracverse and start earning! 💰')}&hashtags=MLM,Tracverse,Earnings`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Join me on Tracverse and start earning! ${referralUrl}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Join me on Tracverse and start earning!')}`
    };

    res.json({
      referral_code: user.referral_code,
      referral_url: referralUrl,
      share_links: shareLinks,
      share_text: {
        short: 'Join me on Tracverse and start earning!',
        long: 'I\'ve been earning money with Tracverse by completing simple tasks. Join my team and start earning too!',
        with_stats: 'Join my successful Tracverse team! We\'re building wealth together through smart task completion.'
      }
    });

  } catch (error) {
    console.error('Share Links Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate share links',
      message: error.message 
    });
  }
});

/**
 * GET /api/marketing/materials
 * Get marketing materials library
 */
router.get('/materials', async (req, res) => {
  try {
    const materials = {
      banners: [
        { id: 1, title: 'Join Tracverse Banner', size: '728x90', url: '/assets/banners/join-banner.png' },
        { id: 2, title: 'Earn Money Banner', size: '300x250', url: '/assets/banners/earn-banner.png' }
      ],
      images: [
        { id: 1, title: 'Success Story', description: 'Team success image', url: '/assets/images/success.jpg' },
        { id: 2, title: 'Earnings Chart', description: 'Income potential chart', url: '/assets/images/earnings.jpg' }
      ],
      videos: [
        { id: 1, title: 'How Tracverse Works', duration: '2:30', url: '/assets/videos/how-it-works.mp4' },
        { id: 2, title: 'Success Stories', duration: '3:45', url: '/assets/videos/testimonials.mp4' }
      ],
      templates: [
        {
          id: 1,
          title: 'Email Template',
          type: 'email',
          content: 'Hi [NAME], I wanted to share an amazing opportunity with you...'
        },
        {
          id: 2,
          title: 'Social Media Post',
          type: 'social',
          content: '🚀 Just hit my monthly goal with Tracverse! Join my team: [REFERRAL_LINK]'
        }
      ]
    };

    res.json({
      materials,
      total_items: Object.values(materials).reduce((sum, arr) => sum + arr.length, 0)
    });

  } catch (error) {
    console.error('Marketing Materials Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch marketing materials',
      message: error.message 
    });
  }
});

module.exports = router;
