const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken } = require('../middleware/auth-enterprise');
const { hashPassword } = require('../utils/auth');
const { validateEmail, validatePassword, sanitizeInput } = require('../utils/validation');

const router = express.Router();
// Use service key for admin operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user from custom users table using Supabase Auth ID
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !users) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.success({
      id: users.user_id,
      email: users.email,
      referral_code: users.referral_code,
      rank: users.rank || 'Bronze',
      personal_volume: users.personal_volume || 0,
      team_volume: users.team_volume || 0,
      total_earnings: users.total_earnings || 0,
      active_status: users.active_status !== false,
      created_at: users.created_at,
      updated_at: users.updated_at
    }, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const updates = {};

    if (email) {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      if (!validateEmail(sanitizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updates.email = sanitizedEmail;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.userId)
      .select('id, email, referral_code, rank, active_status')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw error;
    }

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'New password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }

    // Get current password hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const { comparePassword } = require('../utils/auth');
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', req.user.userId);

    if (updateError) {
      throw updateError;
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id, email, referral_code, rank, active_status,
        personal_volume, team_volume, total_earnings
      `)
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get team size
    const { count: teamSize } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('sponsor_id', req.user.userId);

    // Get pending commissions
    const { data: pendingCommissions } = await supabase
      .from('commissions')
      .select('amount')
      .eq('user_id', req.user.userId)
      .eq('status', 'pending');

    const pendingAmount = pendingCommissions?.reduce((sum, comm) => sum + comm.amount, 0) || 0;

    // Get recent activity (last 10 commissions)
    const { data: recentActivity } = await supabase
      .from('commissions')
      .select('amount, type, created_at')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        referral_code: user.referral_code,
        rank: user.rank || 'Bronze',
        active_status: user.active_status
      },
      metrics: {
        totalEarnings: user.total_earnings || 0,
        currentRank: user.rank || 'Bronze',
        teamSize: teamSize || 0,
        monthlyVolume: user.team_volume || 0,
        pendingCommissions: pendingAmount
      },
      recentActivity: recentActivity || []
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
