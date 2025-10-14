// routes/tasks.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-enterprise');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /api/tasks
 * Get user's tasks and statistics
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, type } = req.query;

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }

    // Calculate statistics
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
    const totalRewards = tasks?.filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.reward_amount || 0), 0) || 0;

    res.success({
      tasks: tasks || [],
      statistics: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        total_rewards: totalRewards,
        completion_rate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
      }
    }, 'Tasks retrieved successfully');

  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tasks/exclusive/:userId
 * Get exclusive tasks available to user based on rank
 */
router.get('/exclusive/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const tasks = await mlmService.getExclusiveTasks(userId);

    res.json({
      tasks,
      count: tasks.length
    });

  } catch (error) {
    console.error('Exclusive Tasks Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch exclusive tasks',
      message: error.message 
    });
  }
});

/**
 * POST /api/tasks/complete
 * Complete an exclusive task
 */
router.post('/complete', async (req, res) => {
  try {
    const { user_id, task_id } = req.body;

    if (!user_id || !task_id) {
      return res.status(400).json({ 
        error: 'User ID and Task ID are required' 
      });
    }

    const result = await mlmService.completeExclusiveTask(user_id, task_id);

    res.json({
      message: 'Task completed successfully',
      task: result.task.title,
      points_earned: result.points_earned,
      commissions_generated: result.commissions.length
    });

  } catch (error) {
    console.error('Task Completion Error:', error);
    res.status(500).json({ 
      error: 'Failed to complete task',
      message: error.message 
    });
  }
});

module.exports = router;
