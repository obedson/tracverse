// test-matching-bonuses.js
require('dotenv').config();
const mlmService = require('./services/mlmService');
const { supabase } = require('./config/supabase');

async function testMatchingBonuses() {
  console.log('🎯 Testing Matching Bonuses...\n');

  try {
    const timestamp = Date.now();
    
    // Create test users: Root -> User1 -> User2
    const rootUser = await mlmService.registerWithReferral({
      email: `root-${timestamp}@matching-test.com`,
      password: 'test123'
    });

    const user1 = await mlmService.registerWithReferral({
      email: `user1-${timestamp}@matching-test.com`, 
      password: 'test123'
    }, rootUser.user.referral_code);

    const user2 = await mlmService.registerWithReferral({
      email: `user2-${timestamp}@matching-test.com`,
      password: 'test123'
    }, user1.user.referral_code);

    console.log('✅ Test users created');
    console.log(`   Root: ${rootUser.user.referral_code} (Bronze)`);
    console.log(`   User1: ${user1.user.referral_code} (Bronze)`);
    console.log(`   User2: ${user2.user.referral_code} (Bronze)`);

    // Promote Root to Silver rank for higher matching bonus
    await supabase
      .from('users')
      .update({ rank: 'silver' })
      .eq('id', rootUser.user.id);

    console.log('\n📈 Promoted Root to Silver rank');

    // User2 completes task (100 points)
    console.log('\n💰 User2 completes task (100 points)...');
    const result = await mlmService.processTaskCompletion(user2.user.id, 100);

    console.log(`✅ Commissions created: ${result.commissions.length}`);

    // Analyze commissions
    const levelCommissions = result.commissions.filter(c => c.commission_type === 'level');
    const matchingBonuses = result.commissions.filter(c => c.commission_type === 'matching');

    console.log('\n📊 Commission Breakdown:');
    levelCommissions.forEach(comm => {
      console.log(`   Level ${comm.level}: $${comm.amount} to ${comm.user_id}`);
    });

    console.log('\n🎁 Matching Bonuses:');
    matchingBonuses.forEach(bonus => {
      console.log(`   Matching: $${bonus.amount} to ${bonus.user_id} (from ${bonus.from_user_id})`);
    });

    // Verify matching bonus calculation
    const user1LevelCommission = levelCommissions.find(c => c.user_id === user1.user.id);
    const rootMatchingBonus = matchingBonuses.find(b => b.user_id === rootUser.user.id);

    if (user1LevelCommission && rootMatchingBonus) {
      const expectedMatching = user1LevelCommission.amount * 0.20; // Silver = 20%
      const actualMatching = parseFloat(rootMatchingBonus.amount);
      
      console.log('\n🔍 Verification:');
      console.log(`   User1 Level Commission: $${user1LevelCommission.amount}`);
      console.log(`   Expected Matching (20%): $${expectedMatching.toFixed(2)}`);
      console.log(`   Actual Matching: $${actualMatching.toFixed(2)}`);
      console.log(`   ✅ Match: ${Math.abs(expectedMatching - actualMatching) < 0.01 ? 'PASS' : 'FAIL'}`);
    }

    console.log('\n🎉 Matching bonuses test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testMatchingBonuses();
}

module.exports = { testMatchingBonuses };
