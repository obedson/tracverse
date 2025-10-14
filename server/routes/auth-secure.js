const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = '24h';

// Secure user registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, referralCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();

    // Create user with secure password
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email,
        password: hashedPassword,
        referral_code: `REF${Date.now()}${Math.random().toString(36).substr(2, 4)}`.toUpperCase(),
        referred_by_code: referralCode || null,
        active_status: true,
        created_at: new Date().toISOString(),
        // Initialize earnings tracking
        total_referral_earnings: 0,
        current_plan_earnings: 0,
        current_membership_plan: null,
        earnings_cap_reached: false,
        cap_warning_sent: false
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Registration failed' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.user_id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.user_id,
        email: newUser.email,
        referral_code: newUser.referral_code
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Secure user login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user with password
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last login
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', user.user_id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        email: user.email,
        referral_code: user.referral_code,
        rank: user.rank,
        active_status: user.active_status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Migrate existing users with secure passwords
router.post('/migrate-secure', async (req, res) => {
  try {
    const { defaultPassword = 'TempPass123!' } = req.body;

    // Get users without user_id or with plain text passwords
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or('user_id.is.null,password.is.null');

    if (error || !users || users.length === 0) {
      return res.json({ message: 'No users need migration' });
    }

    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    let migrated = 0;

    for (const user of users) {
      try {
        const userId = user.user_id || crypto.randomUUID();
        
        await supabase
          .from('users')
          .update({
            user_id: userId,
            password: hashedPassword,
            // Initialize earnings columns if missing
            total_referral_earnings: user.total_referral_earnings || 0,
            current_plan_earnings: user.current_plan_earnings || 0,
            current_membership_plan: user.current_membership_plan || null,
            earnings_cap_reached: user.earnings_cap_reached || false,
            cap_warning_sent: user.cap_warning_sent || false
          })
          .eq('id', user.id);

        migrated++;
      } catch (err) {
        console.error(`Migration failed for ${user.email}:`, err);
      }
    }

    res.json({
      message: `Secure migration complete: ${migrated} users`,
      migrated,
      defaultPassword: defaultPassword
    });

  } catch (error) {
    console.error('Secure migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

module.exports = router;
