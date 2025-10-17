const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/verification/queue - Get verification tasks for user
router.get('/queue', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';

    // Get pending task submissions that need verification
    const { data: submissions } = await supabase
      .from('task_submissions')
      .select(`
        id,
        task_id,
        user_id,
        evidence_file,
        submitted_at,
        tasks (
          type,
          platform,
          pp_reward,
          content_url
        )
      `)
      .eq('status', 'pending_verification')
      .neq('user_id', userId) // Don't show user's own submissions
      .order('submitted_at', { ascending: true })
      .limit(10);

    const verificationTasks = submissions?.map(submission => ({
      id: submission.id,
      task_type: submission.tasks?.type || 'unknown',
      platform: submission.tasks?.platform || 'unknown',
      evidence_url: `/uploads/evidence/${submission.evidence_file?.split('/').pop()}`,
      evidence_type: submission.evidence_file?.includes('.mp4') || submission.evidence_file?.includes('.mov') ? 'video' : 'image',
      reward: getVerificationReward('Silver'), // Default to Silver level
      submitted_by: `user${submission.user_id.slice(-3)}`,
      submitted_at: submission.submitted_at,
      requirements: getVerificationRequirements(submission.tasks?.type, submission.tasks?.platform)
    })) || [];

    res.json({ tasks: verificationTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/verification/stats - Get verifier statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';

    // Get verifier stats (mock data for now)
    const stats = {
      level: 'Silver',
      reputation: 750,
      total_verifications: 234,
      accuracy_rate: 94,
      earnings_today: 35,
      daily_quota: 20,
      completed_today: 5
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/verification/:id/submit - Submit verification decision
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, rating, feedback } = req.body;
    const verifierId = req.user?.userId || 'anonymous';

    // Update task submission status
    const newStatus = approved ? 'verified_approved' : 'verified_rejected';
    
    const { data: submission } = await supabase
      .from('task_submissions')
      .update({
        status: newStatus,
        verifier_id: verifierId,
        verification_rating: rating,
        verification_feedback: feedback,
        verified_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Create verification record
    const { data: verification } = await supabase
      .from('verifications')
      .insert({
        submission_id: id,
        verifier_id: verifierId,
        decision: approved ? 'approved' : 'rejected',
        rating,
        feedback,
        reward_earned: getVerificationReward('Silver'),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // If approved, process task completion and trigger MLM commissions
    if (approved) {
      // Get task details
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', submission.task_id)
        .single();

      if (task) {
        // Process MLM commissions for task completion
        try {
          const response = await fetch('/api/commissions/process-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: submission.user_id,
              points_earned: task.pp_reward
            })
          });
        } catch (commissionError) {
          console.error('Failed to process commissions:', commissionError);
        }
      }
    }

    res.json({ 
      message: 'Verification submitted successfully',
      verification,
      reward_earned: getVerificationReward('Silver')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/verification/history - Get verifier's verification history
router.get('/history', async (req, res) => {
  try {
    const verifierId = req.user?.userId || 'anonymous';
    const { page = 1, limit = 20 } = req.query;

    const { data: verifications } = await supabase
      .from('verifications')
      .select(`
        *,
        task_submissions (
          tasks (
            type,
            platform,
            pp_reward
          )
        )
      `)
      .eq('verifier_id', verifierId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const totalEarned = verifications?.reduce((sum, v) => sum + (v.reward_earned || 0), 0) || 0;

    res.json({
      verifications: verifications || [],
      statistics: {
        total_verifications: verifications?.length || 0,
        total_earned: totalEarned,
        average_rating: verifications?.reduce((sum, v) => sum + (v.rating || 0), 0) / (verifications?.length || 1) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function getVerificationReward(level) {
  const rewards = {
    'Bronze': 5,
    'Silver': 7,
    'Gold': 10,
    'Diamond': 15
  };
  return rewards[level] || 5;
}

function getVerificationRequirements(taskType, platform) {
  const requirements = {
    subscribe: {
      youtube: 'Screenshot showing subscribed status with bell icon activated',
      instagram: 'Screenshot showing "Following" status on profile',
      tiktok: 'Screenshot showing "Following" status on profile'
    },
    like: {
      youtube: 'Screenshot showing thumbs up (like) button highlighted',
      instagram: 'Screenshot showing red heart on the post',
      tiktok: 'Screenshot showing red heart on the video'
    },
    comment: {
      youtube: 'Screenshot of posted comment visible in comments section',
      instagram: 'Screenshot of comment under the post',
      tiktok: 'Screenshot of comment on the video'
    }
  };

  return requirements[taskType]?.[platform] || 'Screenshot showing task completion proof';
}

module.exports = router;
