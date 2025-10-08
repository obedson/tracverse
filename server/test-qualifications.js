// test-qualifications.js
require('dotenv').config();
const mlmService = require('./services/mlmService');
const { supabase } = require('./config/supabase');

async function testQualifications() {
  console.log('📊 Testing Monthly Qualifications...\n');

  try {
    const timestamp = Date.now();
    
    // Create user who will qualify for Silver
    const user = await mlmService.registerWithReferral({
      email: `qualifier-${timestamp}@test.com`,
      password: 'test123'
    });

    console.log(`✅ User created: ${user.user.referral_code}`);

    // Add personal volume to meet Silver requirements
    await supabase
      .from('users')
      .update({ personal_volume: 600 }) // Above Silver requirement (500)
      .eq('id', user.user.id);

    // Create 4 direct referrals (above Silver requirement of 3)
    console.log('\n👥 Creating referrals...');
    for (let i = 0; i < 4; i++) {
      const referral = await mlmService.registerWithReferral({
        email: `referral${i}-${timestamp}@test.com`,
        password: 'test123'
      }, user.user.referral_code);
      
      console.log(`   ✅ Referral ${i + 1}: ${referral.user.referral_code}`);
    }

    // Update monthly qualifications
    console.log('\n📋 Processing monthly qualifications...');
    const qualification = await mlmService.updateMonthlyQualifications(user.user.id);

    console.log('✅ Qualification processed:');
    console.log(`   Period: ${qualification.period}`);
    console.log(`   Personal Volume: $${qualification.personal_volume}`);
    console.log(`   Direct Referrals: ${qualification.direct_referrals}`);
    console.log(`   Qualified Rank: ${qualification.rank_achieved}`);
    console.log(`   Qualified: ${qualification.qualified ? 'YES' : 'NO'}`);

    // Verify Silver qualification
    const expectedRank = 'silver'; // 4 referrals + $600 volume = Silver
    console.log('\n🔍 Verification:');
    console.log(`   Expected rank: ${expectedRank}`);
    console.log(`   Actual rank: ${qualification.rank_achieved}`);
    console.log(`   ✅ Match: ${qualification.rank_achieved === expectedRank ? 'PASS' : 'FAIL'}`);

    // Test bulk processing
    console.log('\n🔄 Testing bulk qualification processing...');
    const allQualifications = await mlmService.processMonthlyQualifications();
    console.log(`✅ Processed ${allQualifications.length} users`);

    console.log('\n🎉 Monthly qualifications test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testQualifications();
}
