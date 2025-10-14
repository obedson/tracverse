const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-enterprise');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Get all membership plans
router.get('/', async (req, res) => {
  try {
    // Return the 15-tier membership structure (70% PP allocation, 30% for referrals/platform)
    const plans = [
      { id: 1, name: 'Bronze I', tier_level: 1, pp_allocation: 700, price_naira: 25000 },
      { id: 2, name: 'Bronze II', tier_level: 2, pp_allocation: 1750, price_naira: 62500 },
      { id: 3, name: 'Bronze III', tier_level: 3, pp_allocation: 3500, price_naira: 125000 },
      { id: 4, name: 'Silver I', tier_level: 4, pp_allocation: 7000, price_naira: 250000 },
      { id: 5, name: 'Silver II', tier_level: 5, pp_allocation: 14000, price_naira: 500000 },
      { id: 6, name: 'Silver III', tier_level: 6, pp_allocation: 28000, price_naira: 1000000 },
      { id: 7, name: 'Gold I', tier_level: 7, pp_allocation: 52500, price_naira: 1875000 },
      { id: 8, name: 'Gold II', tier_level: 8, pp_allocation: 105000, price_naira: 3750000 },
      { id: 9, name: 'Gold III', tier_level: 9, pp_allocation: 210000, price_naira: 7500000 },
      { id: 10, name: 'Platinum I', tier_level: 10, pp_allocation: 350000, price_naira: 12500000 },
      { id: 11, name: 'Platinum II', tier_level: 11, pp_allocation: 700000, price_naira: 25000000 },
      { id: 12, name: 'Platinum III', tier_level: 12, pp_allocation: 1400000, price_naira: 50000000 },
      { id: 13, name: 'Diamond I', tier_level: 13, pp_allocation: 2450000, price_naira: 87500000 },
      { id: 14, name: 'Diamond II', tier_level: 14, pp_allocation: 4900000, price_naira: 175000000 },
      { id: 15, name: 'Diamond III', tier_level: 15, pp_allocation: 10500000, price_naira: 375000000 }
    ];

    res.success(plans);
  } catch (error) {
    console.error('Membership plans error:', error);
    res.error('Failed to fetch membership plans', 500);
  }
});

module.exports = router;
