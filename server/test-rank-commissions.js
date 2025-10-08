// test-rank-commissions.js
require('dotenv').config();
const mlmService = require('./services/mlmService');
const { supabase } = require('./config/supabase');

async function testRankCommissions() {
  console.log('🏆 Testing Rank-Based Commission Rates...\n');

  try {
    const timestamp = Date.now();
    
    // Create Bronze and Diamond sponsors
    const bronzeSponsor = await mlmService.registerWithReferral({
      email: `bronze-${timestamp}@test.com`,
      password: 'test123'
    });

    const diamondSponsor = await mlmService.registerWithReferral({
      email: `diamond-${timestamp}@test.com`,
      password: 'test123'
    });

    // Set Diamond rank
    await supabase
      .from('users')
      .update({ rank: 'diamond' })
      .eq('id', diamondSponsor.user.id);

    console.log(`✅ Bronze sponsor: ${bronzeSponsor.user.referral_code}`);
    console.log(`✅ Diamond sponsor: ${diamondSponsor.user.referral_code}`);

    // Create downlines
    const bronzeDownline = await mlmService.registerWithReferral({
      email: `bronze-downline-${timestamp}@test.com`,
      password: 'test123'
    }, bronzeSponsor.user.referral_code);

    const diamondDownline = await mlmService.registerWithReferral({
      email: `diamond-downline-${timestamp}@test.com`,
      password: 'test123'
    }, diamondSponsor.user.referral_code);

    console.log('\n💰 Both downlines complete 100-point tasks...');

    // Process tasks for both downlines
    const bronzeResult = await mlmService.processTaskCompletion(bronzeDownline.user.id, 100);
    const diamondResult = await mlmService.processTaskCompletion(diamondDownline.user.id, 100);

    // Get level commissions (exclude matching bonuses)
    const bronzeCommission = bronzeResult.commissions.find(c => 
      c.commission_type === 'level' && c.user_id === bronzeSponsor.user.id
    );
    
    const diamondCommission = diamondResult.commissions.find(c => 
      c.commission_type === 'level' && c.user_id === diamondSponsor.user.id
    );

    console.log('\n📊 Commission Comparison:');
    console.log(`   Bronze sponsor (1.0x): $${bronzeCommission?.amount || 0}`);
    console.log(`   Diamond sponsor (2.0x): $${diamondCommission?.amount || 0}`);

    // Verify rates
    const expectedBronze = 100 * 0.10; // 10%
    const expectedDiamond = 100 * 0.10 * 2.0; // 10% * 2x multiplier

    console.log('\n🔍 Verification:');
    console.log(`   Expected Bronze: $${expectedBronze}`);
    console.log(`   Expected Diamond: $${expectedDiamond}`);
    console.log(`   Bronze Match: ${parseFloat(bronzeCommission?.amount) === expectedBronze ? '✅' : '❌'}`);
    console.log(`   Diamond Match: ${parseFloat(diamondCommission?.amount) === expectedDiamond ? '✅' : '❌'}`);

    console.log('\n🎉 Rank-based commission test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testRankCommissions();
}
