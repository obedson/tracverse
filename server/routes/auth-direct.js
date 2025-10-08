const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');
const { validateEmail, validatePassword, sanitizeInput } = require('../utils/validation');
const { generateReferralCode } = require('../utils/idGenerator');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Register endpoint using direct SQL
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

    // Check if user already exists using direct SQL
    const { data: existingUser } = await supabase.rpc('check_user_exists', {
      user_email: sanitizedEmail
    });

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password and generate referral code
    const hashedPassword = await hashPassword(password);
    const referralCode = generateReferralCode();

    // Create user using direct SQL
    const { data: newUser, error: createError } = await supabase.rpc('create_user_with_auth', {
      user_email: sanitizedEmail,
      user_password_hash: hashedPassword,
      user_referral_code: referralCode,
      user_sponsor_code: sponsor_code || null
    });

    if (createError) {
      console.error('User creation error:', createError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: newUser[0].id,
      email: newUser[0].email,
      referralCode: newUser[0].referral_code
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser[0],
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
