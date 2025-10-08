const express = require('express');
const router = express.Router();

// Mock commission data
const mockCommissions = [
  {
    id: 'comm-1',
    user_id: 'test-user-1',
    from_user_id: 'test-user-2',
    amount: 100.00,
    type: 'direct',
    level: 1,
    status: 'paid',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'comm-2', 
    user_id: 'test-user-1',
    from_user_id: 'test-user-3',
    amount: 50.00,
    type: 'override',
    level: 2,
    status: 'pending',
    created_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'comm-3',
    user_id: 'test-user-1', 
    from_user_id: 'test-user-4',
    amount: 75.00,
    type: 'leadership',
    level: 1,
    status: 'paid',
    created_at: '2024-01-25T09:15:00Z'
  },
  {
    id: 'comm-4',
    user_id: 'test-user-1',
    from_user_id: 'test-user-5', 
    amount: 25.00,
    type: 'matching',
    level: 1,
    status: 'pending',
    created_at: '2024-01-28T16:45:00Z'
  }
];

// Get commissions
router.get('/', (req, res) => {
  try {
    res.json(mockCommissions);
  } catch (error) {
    console.error('Mock commissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
