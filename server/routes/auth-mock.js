const express = require('express');
const { generateToken } = require('../utils/auth');

const router = express.Router();

// Mock users for testing
const mockUsers = [
  {
    id: 'test-user-1',
    email: 'test@tracverse.com',
    password: 'Test123!',
    referral_code: 'TEST001',
    rank: 'Bronze',
    active_status: true
  },
  {
    id: 'test-user-2', 
    email: 'admin@tracverse.com',
    password: 'Admin123!',
    referral_code: 'ADMIN001',
    rank: 'Gold',
    active_status: true
  }
];

// Mock register
router.post('/register', async (req, res) => {
  try {
    const { email, password, sponsor_code } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const newUser = {
      id: `mock-user-${Date.now()}`,
      email,
      referral_code: `REF${Date.now()}`,
      rank: 'Bronze',
      active_status: true,
      created_at: new Date().toISOString()
    };

    mockUsers.push({ ...newUser, password });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      referralCode: newUser.referral_code
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });

  } catch (error) {
    console.error('Mock registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
        rank: user.rank,
        active_status: user.active_status
      },
      token
    });

  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
