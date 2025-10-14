const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addEarningsColumns() {
  try {
    console.log('💰 Adding referral earnings tracking columns...');

    // Get first user to test column addition
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (users && users.length > 0) {
      // Try to update with new columns
      const { error } = await supabase
        .from('users')
        .update({
          total_referral_earnings: 0.00,
          current_plan_earnings: 0.00,
          current_membership_plan: null,
          earnings_cap_reached: false,
          cap_warning_sent: false
        })
        .eq('id', users[0].id);

      if (error) {
        console.log('⚠️  Columns need to be added manually in Supabase dashboard:');
        console.log('   - total_referral_earnings (numeric, default 0)');
        console.log('   - current_plan_earnings (numeric, default 0)');
        console.log('   - current_membership_plan (text, nullable)');
        console.log('   - earnings_cap_reached (boolean, default false)');
        console.log('   - cap_warning_sent (boolean, default false)');
      } else {
        console.log('✅ Earnings tracking columns working');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addEarningsColumns();
