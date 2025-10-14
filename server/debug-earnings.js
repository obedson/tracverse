const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugEarnings() {
  try {
    console.log('🔍 Debugging Earnings Columns...');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Get user with all columns
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'obedsonfield@gmail.com')
      .limit(1);

    if (error) {
      console.log('❌ Query error:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = users[0];
    console.log('✅ User found:', user.email);
    console.log('📊 All earnings columns:');
    console.log('   total_referral_earnings:', user.total_referral_earnings);
    console.log('   current_plan_earnings:', user.current_plan_earnings);
    console.log('   current_membership_plan:', user.current_membership_plan);
    console.log('   earnings_cap_reached:', user.earnings_cap_reached);
    console.log('   cap_warning_sent:', user.cap_warning_sent);

    // Simple update test
    console.log('\n💰 Testing simple update...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        current_membership_plan: 'Bronze I',
        current_plan_earnings: 15000
      })
      .eq('email', 'obedsonfield@gmail.com');

    if (updateError) {
      console.log('❌ Update failed:', updateError);
    } else {
      console.log('✅ Update successful');
    }

    // Verify with fresh query
    const { data: updated } = await supabase
      .from('users')
      .select('current_membership_plan, current_plan_earnings')
      .eq('email', 'obedsonfield@gmail.com')
      .limit(1);

    if (updated && updated.length > 0) {
      console.log('✅ Verification successful:', updated[0]);
      
      // Calculate Bronze I cap (₦25k * 200% = ₦50k)
      const earnings = parseFloat(updated[0].current_plan_earnings || 0);
      const limit = 50000;
      const percentage = (earnings / limit) * 100;
      
      console.log('\n📊 Cap Analysis:');
      console.log(`   Current: ₦${earnings.toLocaleString()}`);
      console.log(`   Limit: ₦${limit.toLocaleString()}`);
      console.log(`   Used: ${percentage.toFixed(1)}%`);
      console.log(`   Status: ${earnings < limit ? '✅ Can earn' : '❌ Cap reached'}`);
    } else {
      console.log('❌ Verification failed');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugEarnings();
