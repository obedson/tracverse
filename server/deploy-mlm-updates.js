const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function deployMLMUpdates() {
  console.log('🚀 Deploying MLM Updates...\n');

  try {
    // 1. Add membership_price column
    console.log('1. Adding membership_price column...');
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_price DECIMAL(10,2) DEFAULT 25000'
    });

    // 2. Update existing users with membership prices
    console.log('2. Setting default membership prices...');
    await supabase
      .from('users')
      .update({ membership_price: 25000 })
      .is('membership_price', null);

    // 3. Create test sponsor user
    console.log('3. Creating test sponsor...');
    const { data: sponsor } = await supabase
      .from('users')
      .upsert({
        email: 'sponsor@test.com',
        referral_code: 'SPONSOR123',
        membership_price: 50000,
        active_status: true
      })
      .select()
      .single();

    // 4. Create test referral user
    console.log('4. Creating test referral...');
    const { data: referral } = await supabase
      .from('users')
      .upsert({
        email: 'referral@test.com',
        referral_code: 'REF456',
        sponsor_id: sponsor?.id,
        membership_price: 25000,
        active_status: true
      })
      .select()
      .single();

    console.log('✅ MLM Updates Deployed Successfully!');
    console.log(`Sponsor ID: ${sponsor?.id}`);
    console.log(`Referral ID: ${referral?.id}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deployMLMUpdates();
