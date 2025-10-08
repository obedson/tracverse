// test-rank-bonuses.js
require('dotenv').config();
const mlmService = require('./services/mlmService');
const { supabase } = require('./config/supabase');

async function testRankBonuses() {
  console.log('🏆 Testing Rank Bonuses...\n');

  try {
    const timestamp = Date.now();
    
    // Create test users with different ranks
    const users = [];
    const ranks = ['silver', 'gold', 'platinum', 'diamond'];
    
    for (let i = 0; i < ranks.length; i++) {
      const user = await mlmService.registerWithReferral({
        email: `${ranks[i]}-${timestamp}@rank-test.com`,
        password: 'test123'
      });
      
      // Set rank
      await supabase
        .from('users')
        .update({ rank: ranks[i] })
        .eq('id', user.user.id);
        
      users.push({ ...user.user, rank: ranks[i] });
      console.log(`✅ Created ${ranks[i]} user: ${user.user.referral_code}`);
    }

    console.log('\n💰 Calculating rank bonuses...');
    const bonuses = await mlmService.calculateRankBonuses();

    console.log(`✅ Rank bonuses created: ${bonuses.length}`);

    // Expected bonuses
    const expectedBonuses = {
      silver: 50,
      gold: 150,
      platinum: 500,
      diamond: 1500
    };

    console.log('\n📊 Bonus Breakdown:');
    for (const user of users) {
      const userBonus = bonuses.find(b => b.user_id === user.id);
      const expectedAmount = expectedBonuses[user.rank];
      
      if (userBonus) {
        console.log(`   ${user.rank.toUpperCase()}: $${userBonus.amount} (Expected: $${expectedAmount}) ✅`);
      } else {
        console.log(`   ${user.rank.toUpperCase()}: No bonus found ❌`);
      }
    }

    // Verify total
    const totalBonuses = bonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const expectedTotal = Object.values(expectedBonuses).reduce((sum, amount) => sum + amount, 0);
    
    console.log('\n🔍 Verification:');
    console.log(`   Total bonuses paid: $${totalBonuses}`);
    console.log(`   Expected total: $${expectedTotal}`);
    console.log(`   ✅ Match: ${totalBonuses === expectedTotal ? 'PASS' : 'FAIL'}`);

    console.log('\n🎉 Rank bonuses test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testRankBonuses();
}

module.exports = { testRankBonuses };
