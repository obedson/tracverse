// test-commissions.js
require('dotenv').config();
const mlmService = require('./services/mlmService');

async function testCommissionSystem() {
  console.log('💰 Testing Commission System...\n');

  try {
    // Use unique emails with timestamp
    const timestamp = Date.now();
    
    // Create test users
    const rootUser = await mlmService.registerWithReferral({
      email: `root-${timestamp}@commission-test.com`,
      password: 'test123'
    });

    const user1 = await mlmService.registerWithReferral({
      email: `user1-${timestamp}@commission-test.com`, 
      password: 'test123'
    }, rootUser.user.referral_code);

    const user2 = await mlmService.registerWithReferral({
      email: `user2-${timestamp}@commission-test.com`,
      password: 'test123'
    }, user1.user.referral_code);

    console.log('✅ Test users created');
    console.log(`   Root: ${rootUser.user.referral_code}`);
    console.log(`   User1: ${user1.user.referral_code}`);
    console.log(`   User2: ${user2.user.referral_code}`);

    // Test commission calculation
    console.log('\n💸 Processing task completion for User2 (100 points)...');
    const result = await mlmService.processTaskCompletion(user2.user.id, 100);
    
    console.log('✅ Commissions calculated:');
    console.log(`   Commissions created: ${result.commissions.length}`);
    result.commissions.forEach((comm, i) => {
      console.log(`   Level ${comm.level}: $${comm.amount} to user ${comm.user_id}`);
    });

    // Test rank advancement
    console.log('\n🏆 Testing rank advancement...');
    const rankResult = await mlmService.checkRankAdvancement(rootUser.user.id);
    console.log('✅ Rank check result:', rankResult);

    console.log('\n🎉 Commission system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testCommissionSystem();
}

module.exports = { testCommissionSystem };
