const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

async function migrateUserSecure() {
  try {
    console.log('🔐 Migrating user to secure authentication...');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Get obedsonfield@gmail.com user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'obedsonfield@gmail.com')
      .single();

    if (error || !user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Found user:', user.email);

    // Set secure password and user_id
    const defaultPassword = 'TempPass123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const userId = user.user_id || crypto.randomUUID();

    const { error: updateError } = await supabase
      .from('users')
      .update({
        user_id: userId,
        password: hashedPassword,
        failed_login_attempts: 0,
        account_locked_until: null,
        // Ensure earnings columns exist
        total_referral_earnings: user.total_referral_earnings || 0,
        current_plan_earnings: user.current_plan_earnings || 15000, // Keep existing 15k
        current_membership_plan: user.current_membership_plan || 'Bronze I',
        earnings_cap_reached: user.earnings_cap_reached || false,
        cap_warning_sent: user.cap_warning_sent || false
      })
      .eq('email', 'obedsonfield@gmail.com');

    if (updateError) {
      console.log('❌ Update failed:', updateError);
      return;
    }

    console.log('✅ User migrated successfully!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password:', defaultPassword);
    console.log('💰 Earnings:', '₦15,000 (30% of Bronze I limit)');
    console.log('🎯 Plan:', 'Bronze I');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateUserSecure();
