const express = require('express');
const router = express.Router();

// Mock data for demonstration (replace with database when ready)
let mockPlans = {
  'Bronze': [
    { level: 1, commission_rate: 0.05 },
    { level: 2, commission_rate: 0.03 },
    { level: 3, commission_rate: 0.02 },
    { level: 4, commission_rate: 0.01 }
  ],
  'Silver': [
    { level: 1, commission_rate: 0.06 },
    { level: 2, commission_rate: 0.04 },
    { level: 3, commission_rate: 0.03 },
    { level: 4, commission_rate: 0.02 },
    { level: 5, commission_rate: 0.01 }
  ],
  'Gold': [
    { level: 1, commission_rate: 0.07 },
    { level: 2, commission_rate: 0.05 },
    { level: 3, commission_rate: 0.04 },
    { level: 4, commission_rate: 0.03 },
    { level: 5, commission_rate: 0.02 },
    { level: 6, commission_rate: 0.01 }
  ]
};

// GET /api/admin/commission-plans - Get all commission plans
router.get('/', async (req, res) => {
  try {
    res.json({ plans: mockPlans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/commission-plans/:tier - Update commission plan for tier
router.put('/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    const { levels } = req.body;

    // Update mock data
    mockPlans[tier] = levels.map(l => ({
      level: l.level,
      commission_rate: l.rate
    }));

    res.json({ 
      message: 'Commission plan updated', 
      data: mockPlans[tier] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
