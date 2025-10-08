const express = require('express');
const router = express.Router();

// Mock referral data
const mockReferrals = [
  {
    id: 'ref-1',
    email: 'member1@example.com',
    sponsor_id: 'test-user-1',
    referral_code: 'REF001',
    rank: 'Bronze',
    personal_volume: 500,
    team_volume: 1200,
    status: 'active',
    joined_date: '2024-01-10T08:00:00Z'
  },
  {
    id: 'ref-2',
    email: 'member2@example.com', 
    sponsor_id: 'test-user-1',
    referral_code: 'REF002',
    rank: 'Silver',
    personal_volume: 800,
    team_volume: 2500,
    status: 'active',
    joined_date: '2024-01-15T12:30:00Z'
  },
  {
    id: 'ref-3',
    email: 'member3@example.com',
    sponsor_id: 'test-user-1', 
    referral_code: 'REF003',
    rank: 'Bronze',
    personal_volume: 300,
    team_volume: 600,
    status: 'active',
    joined_date: '2024-01-22T14:15:00Z'
  }
];

// Get referrals
router.get('/', (req, res) => {
  try {
    res.json(mockReferrals);
  } catch (error) {
    console.error('Mock referrals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
