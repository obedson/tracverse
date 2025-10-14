const { createClient } = require('@supabase/supabase-js');
const { checkEarningsCap, addReferralEarnings } = require('./middleware/earnings-cap');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testEarningsCap() {
  try {
    console.log('🧪 Testing Earnings Cap System...');

    // Get first user
    const { data: users } = await supabase
      .from('users')
      .select('user_id, email, current_membership_plan')
      .limit(1);

    if (!users || users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const testUser = users[0];
    console.log('👤 Testing with user:', testUser.email);

    // Set user as Bronze I member
    await supabase
      .from('users')
      .update({
        current_membership_plan: 'Bronze I',
        current_plan_earnings: 0,
        total_referral_earnings: 0,
        earnings_cap_reached: false,
        cap_warning_sent: false
      })
      .eq('user_id', testUser.user_id);

    console.log('✅ Set user as Bronze I member');

    // Test 1: Check initial cap status
    const initialStatus = await checkEarningsCap(testUser.user_id);
    console.log('📊 Initial cap status:', {
      canEarn: initialStatus.canEarn,
      currentEarnings: initialStatus.currentEarnings,
      earningLimit: initialStatus.earningLimit,
      percentage: initialStatus.percentage?.toFixed(1) + '%'
    });

    // Test 2: Add some earnings (should work)
    console.log('\n💰 Adding ₦20,000 referral earnings...');
    const result1 = await addReferralEarnings(testUser.user_id, 20000);
    console.log('Result:', result1.success ? '✅ Success' : '❌ Failed');

    // Test 3: Check status after earnings
    const afterEarnings = await checkEarningsCap(testUser.user_id);
    console.log('📊 After earnings:', {
      canEarn: afterEarnings.canEarn,
      currentEarnings: afterEarnings.currentEarnings,
      percentage: afterEarnings.percentage?.toFixed(1) + '%'
    });

    // Test 4: Add earnings to reach 90% (should trigger warning)
    console.log('\n⚠️  Adding ₦25,000 more (should trigger 90% warning)...');
    const result2 = await addReferralEarnings(testUser.user_id, 25000);
    console.log('Result:', result2.success ? '✅ Success' : '❌ Failed');

    // Test 5: Final status check
    const finalStatus = await checkEarningsCap(testUser.user_id);
    console.log('📊 Final status:', {
      canEarn: finalStatus.canEarn,
      currentEarnings: finalStatus.currentEarnings,
      percentage: finalStatus.percentage?.toFixed(1) + '%'
    });

    console.log('\n🎯 Earnings Cap System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEarningsCap();
