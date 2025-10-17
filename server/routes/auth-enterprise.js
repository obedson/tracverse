const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Ensure JWT secrets are set
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
const JWT_EXPIRES_IN = '15m'; // Short-lived access token
const REFRESH_EXPIRES_IN = '7d'; // Long-lived refresh token

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: { error: 'Too many registration attempts, try again in 1 hour' }
});

// Strong password validation
const passwordValidator = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain uppercase, lowercase, number and special character');

// Email validation
const emailValidator = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Valid email required');

// Generate tokens
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.user_id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.user_id, email: user.email, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

// Secure registration
router.post('/register', 
  registerLimiter,
  emailValidator,
  passwordValidator,
  body('referralCode').optional().isLength({ min: 3, max: 20 }),
  async (req, res) => {
    try {
      // Validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { email, password, referralCode } = req.body;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password with high cost
      const hashedPassword = await bcrypt.hash(password, 14);
      const userId = crypto.randomUUID();

      // Create user
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
          total_referral_earnings: 0,
          current_plan_earnings: 0,
          current_membership_plan: null,
          earnings_cap_reached: false,
          cap_warning_sent: false,
          failed_login_attempts: 0,
          account_locked_until: null
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Registration failed' });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(newUser);

      // Set secure cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        message: 'Registration successful',
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
  }
);

// Secure login with account lockout
router.post('/login',
  // loginLimiter, // Temporarily disabled for testing
  emailValidator,
  body('password').notEmpty().withMessage('Password required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Get user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check account lockout
      if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
        return res.status(423).json({ 
          error: 'Account temporarily locked due to failed login attempts' 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        // Increment failed attempts
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        const lockUntil = failedAttempts >= 5 ? 
          new Date(Date.now() + 30 * 60 * 1000) : // Lock for 30 minutes
          null;

        await supabase
          .from('users')
          .update({
            failed_login_attempts: failedAttempts,
            account_locked_until: lockUntil?.toISOString()
          })
          .eq('user_id', user.user_id);

        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Reset failed attempts on successful login
      await supabase
        .from('users')
        .update({
          failed_login_attempts: 0,
          account_locked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set secure cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        message: 'Login successful',
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
  }
);

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Set new cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Token refreshed' });

  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Secure logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
