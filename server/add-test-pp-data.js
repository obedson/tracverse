const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addTestPPData() {
  try {
    console.log('💰 Adding test PP data...');

    // Get first user
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (users && users.length > 0) {
      const { error } = await supabase
        .from('users')
        .update({
          total_pp: 5000.00,
          available_pp: 3000.00,
          pending_pp: 2000.00,
          purchased_pp: 3000.00,
          earned_pp: 2000.00
        })
        .eq('id', users[0].id);

      if (error) {
        console.error('❌ Failed:', error);
      } else {
        console.log('✅ Test PP data added to:', users[0].email);
        console.log('   Total PP: 5,000 (₦125,000)');
        console.log('   Available: 3,000 | Pending: 2,000');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addTestPPData();
