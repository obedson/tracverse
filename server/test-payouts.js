// test-payouts.js
require('dotenv').config();
const mlmService = require('./services/mlmService');

async function testPayouts() {
  console.log('💳 Testing Payout Processing...\n');

  try {
    const timestamp = Date.now();
    
    // Create sponsor and downline
    const sponsor = await mlmService.registerWithReferral({
      email: `sponsor-${timestamp}@test.com`,
      password: 'test123'
    });

    const downline = await mlmService.registerWithReferral({
      email: `downline-${timestamp}@test.com`,
      password: 'test123'
    }, sponsor.user.referral_code);

    console.log(`✅ Sponsor created: ${sponsor.user.referral_code}`);
    console.log(`✅ Downline created: ${downline.user.referral_code}`);

    // Generate commissions for sponsor (downline completes tasks)
    console.log('\n💰 Downline completing 60 tasks...');
    for (let i = 0; i < 60; i++) {
      await mlmService.processTaskCompletion(downline.user.id, 1);
    }

    // Check sponsor's pending commissions
    const { supabase } = require('./config/supabase');
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount')
      .eq('user_id', sponsor.user.id)
      .eq('status', 'pending');

    const totalPending = commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    console.log(`   Sponsor's pending: $${totalPending.toFixed(2)}`);

    // Set payout settings for sponsor
    console.log('\n⚙️ Setting sponsor payout preferences...');
    await mlmService.setPayoutSettings(sponsor.user.id, {
      minimum_threshold: 5, // Lower threshold for testing
      payment_method: 'bank_transfer',
      auto_payout: true
    });

    // Process payouts
    console.log('\n🏦 Processing payouts...');
    const payouts = await mlmService.processPayouts();

    const sponsorPayout = payouts.find(p => p.user_id === sponsor.user.id);
    
    if (sponsorPayout) {
      console.log(`✅ Payout created: $${sponsorPayout.amount}`);
      console.log(`   Status: ${sponsorPayout.status}`);
      console.log(`   Method: ${sponsorPayout.payment_method}`);
    } else {
      console.log('❌ No payout created');
    }

    console.log(`\n📊 Total payouts processed: ${payouts.length}`);
    console.log('\n🎉 Payout processing test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testPayouts();
}
