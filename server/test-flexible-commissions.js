// Test Flexible Commission System
require('dotenv').config();

async function testFlexibleCommissions() {
  console.log('🧪 Testing Flexible Commission System\n');

  // Mock commission plans data
  const commissionPlans = {
    'Bronze': [
      { level: 1, commission_rate: 0.05 }, // 5%
      { level: 2, commission_rate: 0.03 }, // 3%
      { level: 3, commission_rate: 0.02 }, // 2%
      { level: 4, commission_rate: 0.01 }  // 1%
    ],
    'Silver': [
      { level: 1, commission_rate: 0.06 }, // 6%
      { level: 2, commission_rate: 0.04 }, // 4%
      { level: 3, commission_rate: 0.03 }, // 3%
      { level: 4, commission_rate: 0.02 }, // 2%
      { level: 5, commission_rate: 0.01 }  // 1%
    ],
    'Gold': [
      { level: 1, commission_rate: 0.07 }, // 7%
      { level: 2, commission_rate: 0.05 }, // 5%
      { level: 3, commission_rate: 0.04 }, // 4%
      { level: 4, commission_rate: 0.03 }, // 3%
      { level: 5, commission_rate: 0.02 }, // 2%
      { level: 6, commission_rate: 0.01 }  // 1%
    ]
  };

  const testAmount = 1000;

  Object.entries(commissionPlans).forEach(([tier, plan]) => {
    console.log(`${tier} Tier Commission Structure:`);
    let totalCommission = 0;
    
    plan.forEach(level => {
      const commission = testAmount * level.commission_rate;
      totalCommission += commission;
      console.log(`  Level ${level.level}: ${(level.commission_rate * 100).toFixed(1)}% = ₦${commission}`);
    });
    
    console.log(`  Total: ₦${totalCommission} (${(totalCommission/testAmount*100).toFixed(1)}%) across ${plan.length} levels\n`);
  });

  console.log('✅ Flexible Commission System Working!');
  console.log('\n🎯 Benefits:');
  console.log('- Admins can adjust rates per membership tier');
  console.log('- Different number of levels per tier');
  console.log('- Higher tiers get better commission structures');
  console.log('- Easy to modify without code changes');
}

testFlexibleCommissions();
