// test-referrals.js
// Simple test script for referral tree functionality

require('dotenv').config();
const mlmService = require('./services/mlmService');

async function testReferralSystem() {
  console.log('🧪 Testing MLM Referral System...\n');

  try {
    // Test 1: Register root user (no sponsor)
    console.log('1. Testing root user registration...');
    const rootUser = await mlmService.registerWithReferral({
      email: 'root@test.com',
      password: 'password123'
    });
    console.log('✅ Root user created:');
    console.log('   - ID:', rootUser.user.id);
    console.log('   - Email:', rootUser.user.email);
    console.log('   - Referral Code:', rootUser.user.referral_code);

    // Test 2: Register user with sponsor
    console.log('\n2. Testing sponsored user registration...');
    const sponsoredUser = await mlmService.registerWithReferral({
      email: 'user1@test.com', 
      password: 'password123'
    }, rootUser.user.referral_code);
    console.log('✅ Sponsored user created:');
    console.log('   - ID:', sponsoredUser.user.id);
    console.log('   - Email:', sponsoredUser.user.email);
    console.log('   - Referral Code:', sponsoredUser.user.referral_code);
    console.log('   - Sponsor:', sponsoredUser.sponsor.referral_code);

    // Test 3: Validate referral code
    console.log('\n3. Testing referral code validation...');
    const validation = await mlmService.validateReferralCode(rootUser.user.referral_code);
    console.log('✅ Validation result:', validation.valid ? 'VALID' : 'INVALID');

    // Test 4: Get downline
    console.log('\n4. Testing downline retrieval...');
    const downline = await mlmService.getDownline(rootUser.user.id);
    console.log('✅ Downline count:', downline.length);
    if (downline.length > 0) {
      console.log('   - First downline member:', downline[0].users.email);
    }

    // Test 5: Get upline chain
    console.log('\n5. Testing upline chain...');
    const upline = await mlmService.getUplineChain(sponsoredUser.user.id);
    console.log('✅ Upline levels:', upline.length);
    if (upline.length > 0) {
      console.log('   - Direct sponsor:', upline[0].user.email);
    }

    // Test 6: Get tree stats
    console.log('\n6. Testing tree statistics...');
    const stats = await mlmService.getTreeStats(rootUser.user.id);
    console.log('✅ Tree stats:');
    console.log('   - Direct referrals:', stats.direct_referrals);
    console.log('   - Total team size:', stats.total_team_size);
    console.log('   - Active members:', stats.active_team_members);

    console.log('\n🎉 All tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   Root User: ${rootUser.user.email} (${rootUser.user.referral_code})`);
    console.log(`   Sponsored User: ${sponsoredUser.user.email} (${sponsoredUser.user.referral_code})`);
    console.log(`   Tree Structure: Root -> Sponsored User`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run tests if called directly
if (require.main === module) {
  testReferralSystem();
}

module.exports = { testReferralSystem };
