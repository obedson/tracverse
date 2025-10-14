const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEarningsSimple() {
  try {
    console.log('🧪 Testing Earnings Columns...');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.log('❌ Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Test 1: Get user and check columns exist
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, email, total_referral_earnings, current_plan_earnings, current_membership_plan')
      .limit(1);

    if (error) {
      console.log('❌ Database error:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const testUser = users[0];
    console.log('✅ Found user:', testUser.email);
    console.log('📊 Current earnings columns:', {
      total_referral_earnings: testUser.total_referral_earnings,
      current_plan_earnings: testUser.current_plan_earnings,
      current_membership_plan: testUser.current_membership_plan
    });

    // Test 2: Update earnings columns
    const { error: updateError } = await supabase
      .from('users')
      .update({
        current_membership_plan: 'Bronze I',
        current_plan_earnings: 20000.00,
        total_referral_earnings: 20000.00
      })
      .eq('user_id', testUser.user_id);

    if (updateError) {
      console.log('❌ Update error:', updateError);
      return;
    }

    console.log('✅ Successfully updated earnings columns');

    // Test 3: Verify update
    const { data: updatedUsers } = await supabase
      .from('users')
      .select('current_membership_plan, current_plan_earnings, total_referral_earnings')
      .eq('user_id', testUser.user_id);

    if (!updatedUsers || updatedUsers.length === 0) {
      console.log('❌ Could not verify update');
      return;
    }

    const updatedUser = updatedUsers[0];
    console.log('✅ Verified update:', updatedUser);

    // Test 4: Calculate cap for Bronze I (₦25k plan, 200% = ₦50k limit)
    const planPrice = 25000;
    const capPercentage = 200;
    const earningLimit = (planPrice * capPercentage) / 100;
    const currentEarnings = parseFloat(updatedUser.current_plan_earnings);
    const usedPercentage = (currentEarnings / earningLimit) * 100;

    console.log('📊 Earnings Cap Analysis:');
    console.log(`   Plan: ${updatedUser.current_membership_plan} (₦${planPrice.toLocaleString()})`);
    console.log(`   Cap: ${capPercentage}% = ₦${earningLimit.toLocaleString()}`);
    console.log(`   Current: ₦${currentEarnings.toLocaleString()}`);
    console.log(`   Used: ${usedPercentage.toFixed(1)}%`);
    console.log(`   Can earn: ${currentEarnings < earningLimit ? '✅ Yes' : '❌ No'}`);

    console.log('\n🎯 Earnings system test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEarningsSimple();
