const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/achievements - Get user's achievements
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';

    // Get user achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at, progress')
      .eq('user_id', userId);

    // Get all available achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('category, target');

    // Merge user progress with achievement definitions
    const achievements = allAchievements?.map(achievement => {
      const userProgress = userAchievements?.find(ua => ua.achievement_id === achievement.id);
      
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        progress: userProgress?.progress || 0,
        target: achievement.target,
        reward: achievement.xp_reward,
        unlocked: !!userProgress?.unlocked_at,
        unlocked_at: userProgress?.unlocked_at
      };
    }) || [];

    res.json({ achievements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/achievements/stats - Get user's achievement statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';

    // Get user level and XP
    const { data: user } = await supabase
      .from('users')
      .select('level, xp, streak_days')
      .eq('id', userId)
      .single();

    // Get achievement counts
    const { data: totalAchievements } = await supabase
      .from('achievements')
      .select('id')
      .eq('is_active', true);

    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .not('unlocked_at', 'is', null);

    const stats = {
      level: user?.level || 1,
      xp: user?.xp || 0,
      next_level_xp: calculateNextLevelXP(user?.level || 1),
      streak_days: user?.streak_days || 0,
      total_achievements: totalAchievements?.length || 0,
      unlocked_achievements: unlockedAchievements?.length || 0
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/achievements/check - Check and unlock achievements for user
router.post('/check', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';
    const { action, data } = req.body; // action: 'task_complete', 'referral_made', etc.

    // Get user's current progress
    const { data: userStats } = await getUserStats(userId);
    
    // Check which achievements should be unlocked
    const newUnlocks = await checkAchievements(userId, action, userStats);

    // Update user XP and level if achievements were unlocked
    if (newUnlocks.length > 0) {
      const totalXP = newUnlocks.reduce((sum, achievement) => sum + achievement.xp_reward, 0);
      await updateUserXP(userId, totalXP);
    }

    res.json({ 
      message: 'Achievements checked',
      new_unlocks: newUnlocks,
      xp_gained: newUnlocks.reduce((sum, a) => sum + a.xp_reward, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/achievements/leaderboard - Get achievement leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { data: topUsers } = await supabase
      .from('users')
      .select('id, email, level, xp')
      .order('xp', { ascending: false })
      .limit(10);

    const leaderboard = topUsers?.map((user, index) => ({
      rank: index + 1,
      user: `User${user.id.slice(-3)}`, // Anonymized
      level: user.level,
      xp: user.xp
    })) || [];

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function getUserStats(userId) {
  const [tasksCompleted, referralsMade, verificationsCompleted, totalEarnings] = await Promise.all([
    supabase.from('task_submissions').select('id').eq('user_id', userId).eq('status', 'verified_approved'),
    supabase.from('users').select('id').eq('sponsor_id', userId),
    supabase.from('verifications').select('id').eq('verifier_id', userId),
    supabase.from('pp_transactions').select('amount').eq('user_id', userId).gt('amount', 0)
  ]);

  return {
    tasks_completed: tasksCompleted.data?.length || 0,
    referrals_made: referralsMade.data?.length || 0,
    verifications_completed: verificationsCompleted.data?.length || 0,
    total_earnings: totalEarnings.data?.reduce((sum, tx) => sum + tx.amount, 0) || 0
  };
}

async function checkAchievements(userId, action, userStats) {
  // Get all achievements that user hasn't unlocked yet
  const { data: availableAchievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .not('id', 'in', 
      supabase.from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId)
        .not('unlocked_at', 'is', null)
    );

  const newUnlocks = [];

  for (const achievement of availableAchievements || []) {
    let shouldUnlock = false;
    let progress = 0;

    switch (achievement.category) {
      case 'tasks':
        progress = userStats.tasks_completed;
        shouldUnlock = progress >= achievement.target;
        break;
      case 'referrals':
        progress = userStats.referrals_made;
        shouldUnlock = progress >= achievement.target;
        break;
      case 'verification':
        progress = userStats.verifications_completed;
        shouldUnlock = progress >= achievement.target;
        break;
      case 'earnings':
        progress = userStats.total_earnings;
        shouldUnlock = progress >= achievement.target;
        break;
    }

    // Update progress
    await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievement.id,
        progress,
        unlocked_at: shouldUnlock ? new Date().toISOString() : null
      });

    if (shouldUnlock) {
      newUnlocks.push(achievement);
    }
  }

  return newUnlocks;
}

async function updateUserXP(userId, xpGained) {
  const { data: user } = await supabase
    .from('users')
    .select('xp, level')
    .eq('id', userId)
    .single();

  const newXP = (user?.xp || 0) + xpGained;
  const newLevel = calculateLevel(newXP);

  await supabase
    .from('users')
    .update({ xp: newXP, level: newLevel })
    .eq('id', userId);
}

function calculateLevel(xp) {
  // Simple level calculation: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function calculateNextLevelXP(currentLevel) {
  // XP needed for next level
  return Math.pow(currentLevel, 2) * 100;
}

module.exports = router;
