const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/social-proof/activities - Get recent platform activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent activities from various sources
    const activities = [];

    // Recent task completions
    const { data: taskCompletions } = await supabase
      .from('task_submissions')
      .select(`
        id,
        created_at,
        user_id,
        tasks (
          pp_reward,
          platform,
          type
        )
      `)
      .eq('status', 'verified_approved')
      .order('created_at', { ascending: false })
      .limit(10);

    taskCompletions?.forEach(completion => {
      activities.push({
        id: completion.id,
        type: 'task_completion',
        user: `User${completion.user_id.slice(-3)}`,
        amount: completion.tasks?.pp_reward,
        description: `completed a ${completion.tasks?.platform} ${completion.tasks?.type} task`,
        timestamp: completion.created_at,
        platform: completion.tasks?.platform
      });
    });

    // Recent user registrations
    const { data: newUsers } = await supabase
      .from('users')
      .select('id, created_at, sponsor_id')
      .not('sponsor_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    newUsers?.forEach(user => {
      activities.push({
        id: user.id,
        type: 'referral_signup',
        user: `User${user.id.slice(-3)}`,
        description: 'joined through referral link',
        timestamp: user.created_at
      });
    });

    // Recent verifications
    const { data: verifications } = await supabase
      .from('verifications')
      .select('id, created_at, verifier_id, reward_earned')
      .order('created_at', { ascending: false })
      .limit(5);

    verifications?.forEach(verification => {
      activities.push({
        id: verification.id,
        type: 'verification_complete',
        user: `User${verification.verifier_id.slice(-3)}`,
        amount: verification.reward_earned,
        description: 'completed task verification',
        timestamp: verification.created_at
      });
    });

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, parseInt(limit));

    res.json({ activities: sortedActivities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social-proof/stats - Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total paid out (sum of all positive PP transactions)
    const { data: earnings } = await supabase
      .from('pp_transactions')
      .select('amount')
      .gt('amount', 0);

    const totalPaid = earnings?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    // Get tasks completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: tasksToday } = await supabase
      .from('task_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified_approved')
      .gte('created_at', today.toISOString());

    // Get active campaigns
    const { count: activeCampaigns } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const stats = {
      total_users: totalUsers || 0,
      total_paid: totalPaid * 25, // Convert PP to Naira (₦25 per PP)
      tasks_completed_today: tasksToday || 0,
      active_campaigns: activeCampaigns || 0
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social-proof/milestones - Get recent platform milestones
router.get('/milestones', async (req, res) => {
  try {
    const milestones = [
      {
        id: '1',
        title: '15,000+ Active Users',
        description: 'Our community has grown to over 15,000 active members!',
        achieved_at: '2024-01-15T00:00:00Z',
        icon: '👥'
      },
      {
        id: '2',
        title: '₦2.5M Total Payouts',
        description: 'We\'ve paid out over ₦2.5 million to our users!',
        achieved_at: '2024-01-10T00:00:00Z',
        icon: '💰'
      },
      {
        id: '3',
        title: '100,000 Tasks Completed',
        description: 'Our community has completed over 100,000 tasks!',
        achieved_at: '2024-01-05T00:00:00Z',
        icon: '🎯'
      }
    ];

    res.json({ milestones });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social-proof/testimonials - Get user testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = [
      {
        id: '1',
        user: 'Sarah M.',
        location: 'Lagos',
        earnings: 25000,
        period: 'first month',
        quote: 'I earned ₦25,000 in my first month through task completions and referrals. This platform has changed my life!',
        rating: 5
      },
      {
        id: '2',
        user: 'David K.',
        location: 'Abuja',
        team_size: 50,
        quote: 'I built a team of 50+ members and now earn passive income through commissions. The MLM system is transparent and fair.',
        rating: 5
      },
      {
        id: '3',
        user: 'Grace A.',
        location: 'Port Harcourt',
        verifications: 1000,
        quote: 'As a top verifier, I\'ve completed over 1,000 verifications and earned consistent daily income. The verification system is well-designed.',
        rating: 5
      }
    ];

    res.json({ testimonials });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
