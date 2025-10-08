const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { generateToken } = require('../utils/auth');
const { validateEmail, validatePassword, sanitizeInput } = require('../utils/validation');
const { generateReferralCode } = require('../utils/idGenerator');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Register endpoint using Supabase Auth
router.post('/register', async (req, res) => {
  try {
    const { email, password, sponsor_code } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }

    // Generate referral code
    const referralCode = generateReferralCode();

    // Create user with Supabase Auth (auto-confirm for testing)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password: password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        referral_code: referralCode,
        sponsor_code: sponsor_code || null,
        rank: 'Bronze',
        personal_volume: 0,
        team_volume: 0,
        total_earnings: 0,
        active_status: true
      }
    });

    if (authError) {
      console.error('User creation error:', authError);
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ error: 'User already exists' });
      }
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: authData.user.id,
      email: authData.user.email,
      referralCode: referralCode
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        referral_code: referralCode,
        active_status: true,
        created_at: authData.user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: password
    });

    if (authError) {
      console.error('Login error:', authError);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user metadata
    const userMetadata = authData.user.user_metadata || {};
    
    // Generate JWT token
    const token = generateToken({
      userId: authData.user.id,
      email: authData.user.email,
      referralCode: userMetadata.referral_code
    });

    res.json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        referral_code: userMetadata.referral_code,
        active_status: userMetadata.active_status || true,
        rank: userMetadata.rank || 'Bronze'
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
