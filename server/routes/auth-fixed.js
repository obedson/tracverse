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

    // Step 1: Create Supabase Auth user first (let trigger handle users table)
    let authUserId = null;
    let userData = null;
    
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: sanitizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          referral_code: sponsor_code || null,
          referral_source: 'direct_registration'
        }
      });

      if (authError) {
        throw new Error(`Auth creation failed: ${authError.message}`);
      }

      authUserId = authData.user.id;

      // Step 2: Get the user record created by trigger
      const { data: triggerUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authUserId)
        .single();

      if (fetchError || !triggerUser) {
        throw new Error('Trigger user creation failed');
      }

      userData = triggerUser;

    } catch (error) {
      console.error('Auth + trigger approach failed:', error.message);
      
      // Fallback: Manual user creation (original approach)
      try {
        const { data: manualUser, error: manualError } = await supabase
          .from('users')
          .insert({
            email: sanitizedEmail,
            referral_code: referralCode,
            referred_by_code: sponsor_code || null,
            rank: 'Bronze',
            personal_volume: 0,
            team_volume: 0,
            total_earnings: 0,
            active_status: true
          })
          .select()
          .single();

        if (manualError) {
          throw new Error('Manual user creation failed');
        }

        userData = manualUser;
      } catch (fallbackError) {
        console.error('All registration methods failed:', fallbackError.message);
        
        // Return error - don't create insecure accounts
        return res.status(500).json({ 
          error: 'Registration temporarily unavailable. Please try again later.',
          details: 'Authentication system required for security'
        });
      }
    }

    // Generate JWT token using our user data (MLM-compliant)
    const token = generateToken({
      userId: userData.id,
      email: userData.email,
      referralCode: userData.referral_code
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userData.id,
        email: userData.email,
        referral_code: userData.referral_code,
        active_status: userData.active_status,
        created_at: userData.created_at,
        auth_linked: !!authUserId
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

    // Step 1: Get user from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', sanitizedEmail)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Step 2: Always require proper authentication
    if (userData.user_id) {
      // User has auth link - use Supabase Auth
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: password
        });

        if (authError) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (authException) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // User without auth link - try to create auth account now
      try {
        console.log('Attempting to create auth for existing user:', userData.email);
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: sanitizedEmail,
          password: password,
          email_confirm: true
        });

        if (authError) {
          return res.status(401).json({ 
            error: 'Account needs activation. Authentication system temporarily unavailable.',
            code: 'AUTH_SYSTEM_DOWN'
          });
        }

        // Link the auth user to existing record
        await supabase
          .from('users')
          .update({ user_id: authData.user.id })
          .eq('id', userData.id);

        console.log('Successfully linked auth to existing user');
        
      } catch (authException) {
        return res.status(401).json({ 
          error: 'Account needs activation. Please try again later.',
          code: 'ACCOUNT_NEEDS_ACTIVATION'
        });
      }
    }

    // Generate JWT token using Supabase Auth ID for security
    const authUserId = userData.user_id || authData?.user?.id;
    if (!authUserId) {
      return res.status(500).json({ error: 'Authentication system error' });
    }
    
    const token = generateToken({
      userId: authUserId,  // Use Supabase Auth ID
      email: userData.email,
      referralCode: userData.referral_code
    });

    res.json({
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        referral_code: userData.referral_code,
        rank: userData.rank,
        total_earnings: userData.total_earnings,
        active_status: userData.active_status
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
