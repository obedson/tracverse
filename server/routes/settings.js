const express = require('express');
const { authenticateToken } = require('../middleware/auth-enterprise');

const router = express.Router();

// System settings (in-memory for now, can be moved to database)
let systemSettings = {
  maintenance_mode: false,
  registration_enabled: true,
  max_referral_levels: 10,
  commission_rates: {
    direct: 0.10,
    binary: 0.05,
    unilevel: 0.03,
    matching: 0.02,
    leadership: 0.01
  },
  rank_requirements: {
    Bronze: { personal_volume: 0, team_volume: 0 },
    Silver: { personal_volume: 1000, team_volume: 5000 },
    Gold: { personal_volume: 2500, team_volume: 15000 },
    Platinum: { personal_volume: 5000, team_volume: 50000 },
    Diamond: { personal_volume: 10000, team_volume: 100000 }
  },
  payout_settings: {
    minimum_payout: 50,
    processing_fee: 2.50,
    processing_days: [1, 15] // 1st and 15th of each month
  }
};

// Get system settings (public)
router.get('/', (req, res) => {
  const publicSettings = {
    registration_enabled: systemSettings.registration_enabled,
    maintenance_mode: systemSettings.maintenance_mode,
    rank_requirements: systemSettings.rank_requirements,
    payout_settings: {
      minimum_payout: systemSettings.payout_settings.minimum_payout,
      processing_days: systemSettings.payout_settings.processing_days
    }
  };
  
  res.success(publicSettings, 'System settings retrieved');
});

// Get all settings (admin only - simplified for now)
router.get('/admin', authenticateToken, (req, res) => {
  res.success(systemSettings, 'Admin settings retrieved');
});

// Update settings (admin only - simplified for now)
router.put('/admin', authenticateToken, (req, res) => {
  const updates = req.body;
  
  // Merge updates with existing settings
  systemSettings = { ...systemSettings, ...updates };
  
  res.success(systemSettings, 'Settings updated successfully');
});

// Health check for system status
router.get('/health', (req, res) => {
  const healthStatus = {
    status: systemSettings.maintenance_mode ? 'maintenance' : 'operational',
    timestamp: new Date().toISOString(),
    services: {
      database: 'operational',
      authentication: 'operational',
      api: 'operational'
    }
  };
  
  res.success(healthStatus, 'System health check');
});

module.exports = router;
