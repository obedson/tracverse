// test-leadership-bonuses.js
require('dotenv').config();
const mlmService = require('./services/mlmService');
const { supabase } = require('./config/supabase');

async function testLeadershipBonuses() {
  console.log('👑 Testing Leadership Bonuses...\n');

  try {
    const timestamp = Date.now();
    
    // Create leader with team
    const leader = await mlmService.registerWithReferral({
      email: `leader-${timestamp}@test.com`,
      password: 'test123'
    });

    // Set leader to Gold rank
    await supabase
      .from('users')
      .update({ rank: 'gold' })
      .eq('id', leader.user.id);

    console.log(`✅ Leader created: ${leader.user.referral_code} (Gold)`);

    // Create 6 team members
    console.log('\n👥 Building team...');
    for (let i = 0; i < 6; i++) {
      const member = await mlmService.registerWithReferral({
        email: `member${i}-${timestamp}@test.com`,
        password: 'test123'
      }, leader.user.referral_code);
      
      console.log(`   ✅ Member ${i + 1}: ${member.user.referral_code}`);
    }

    // Check team stats
    const stats = await mlmService.getTreeStats(leader.user.id);
    console.log(`\n📊 Team stats:`);
    console.log(`   Direct referrals: ${stats.direct_referrals}`);
    console.log(`   Active team members: ${stats.active_team_members}`);

    // Calculate leadership bonuses
    console.log('\n👑 Calculating leadership bonuses...');
    const bonuses = await mlmService.calculateLeadershipBonuses();

    const leaderBonus = bonuses.find(b => b.user_id === leader.user.id);
    
    if (leaderBonus) {
      console.log(`✅ Leadership bonus awarded: $${leaderBonus.amount}`);
      
      // Verify calculation
      const expectedBase = Math.min(stats.active_team_members * 10, 500); // $10 per member
      const expectedBonus = expectedBase * 1.5; // Gold multiplier
      
      console.log('\n🔍 Verification:');
      console.log(`   Base bonus (${stats.active_team_members} × $10): $${expectedBase}`);
      console.log(`   Gold multiplier (1.5x): $${expectedBonus}`);
      console.log(`   Actual bonus: $${leaderBonus.amount}`);
      console.log(`   ✅ Match: ${parseFloat(leaderBonus.amount) === expectedBonus ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('❌ No leadership bonus found');
    }

    console.log('\n🎉 Leadership bonuses test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testLeadershipBonuses();
}
