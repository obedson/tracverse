const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');
const { validateEmail, validatePassword, validateReferralCode, sanitizeInput } = require('../utils/validation');
const { generateReferralCode } = require('../utils/idGenerator');

const router = express.Router();
// Use service key for admin operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Register endpoint
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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Validate sponsor code if provided
    let sponsorId = null;
    if (sponsor_code) {
      if (!validateReferralCode(sponsor_code)) {
        return res.status(400).json({ error: 'Invalid referral code format' });
      }

      const { data: sponsor } = await supabase
        .from('users')
        .select('id, email, referral_code')
        .eq('referral_code', sponsor_code)
        .single();

      if (!sponsor) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }
      sponsorId = sponsor.id;
    }

    // Hash password and generate referral code
    const hashedPassword = await hashPassword(password);
    const referralCode = generateReferralCode();

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: sanitizedEmail,
        password_hash: hashedPassword,
        referral_code: referralCode,
        sponsor_id: sponsorId,
        active_status: true
      })
      .select('id, email, referral_code, active_status, created_at')
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      referralCode: newUser.referral_code
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        referral_code: newUser.referral_code,
        active_status: newUser.active_status,
        created_at: newUser.created_at
      },
      token,
      sponsor: sponsorId ? { id: sponsorId } : null
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

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, referral_code, active_status, rank')
      .eq('email', sanitizedEmail)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.active_status) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      referralCode: user.referral_code
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        referral_code: user.referral_code,
        active_status: user.active_status,
        rank: user.rank
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { verifyToken } = require('../utils/auth');
    const decoded = verifyToken(token);
    
    // Get fresh user data
    const { data: user } = await supabase
      .from('users')
      .select('id, email, referral_code, active_status, rank')
      .eq('id', decoded.userId)
      .single();

    if (!user || !user.active_status) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        referral_code: user.referral_code,
        active_status: user.active_status,
        rank: user.rank
      }
    });

  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;
