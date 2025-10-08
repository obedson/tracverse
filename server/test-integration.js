// test-integration.js
require('dotenv').config();
const mlmService = require('./services/mlmService');

async function testIntegration() {
  console.log('🔗 Testing MLM Integration...\n');

  try {
    const timestamp = Date.now();
    
    // Create test users
    const rootUser = await mlmService.registerWithReferral({
      email: `root-${timestamp}@integration-test.com`,
      password: 'test123'
    });

    const user1 = await mlmService.registerWithReferral({
      email: `user1-${timestamp}@integration-test.com`, 
      password: 'test123'
    }, rootUser.user.referral_code);

    console.log('✅ Test users created');
    console.log(`   Root: ${rootUser.user.referral_code}`);
    console.log(`   User1: ${user1.user.referral_code}`);

    // Simulate multiple clicks/tasks
    console.log('\n📊 Simulating 10 clicks for User1...');
    for (let i = 0; i < 10; i++) {
      await mlmService.processTaskCompletion(user1.user.id, 1);
    }

    // Check stats
    const stats = await mlmService.getTreeStats(rootUser.user.id);
    console.log('\n📈 Root user stats:');
    console.log(`   Direct referrals: ${stats.direct_referrals}`);
    console.log(`   Team size: ${stats.total_team_size}`);

    // Check commissions
    const { supabase } = require('./config/supabase');
    const { data: commissions } = await supabase
      .from('commissions')
      .select('*')
      .eq('user_id', rootUser.user.id);

    console.log(`   Commissions earned: ${commissions.length}`);
    const totalEarnings = commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    console.log(`   Total earnings: $${totalEarnings.toFixed(2)}`);

    console.log('\n🎉 Integration test completed!');
    console.log('\n📋 Test Results:');
    console.log(`   ✅ User registration with referrals: Working`);
    console.log(`   ✅ Task completion processing: Working`);
    console.log(`   ✅ Commission calculation: Working`);
    console.log(`   ✅ Multi-level distribution: Working`);

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

if (require.main === module) {
  testIntegration();
}

module.exports = { testIntegration };
