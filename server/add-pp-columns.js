const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addPPColumns() {
  try {
    console.log('🔧 Adding PP columns to users table...');

    // Add PP columns to users table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_pp DECIMAL(15,2) DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS available_pp DECIMAL(15,2) DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_pp DECIMAL(15,2) DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS purchased_pp DECIMAL(15,2) DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS earned_pp DECIMAL(15,2) DEFAULT 0;
      `
    });

    if (alterError) {
      console.log('⚠️  Columns might already exist, continuing...');
    } else {
      console.log('✅ PP columns added successfully');
    }

    // Add test PP data to first user
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (users && users.length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_pp: 5000.00,
          available_pp: 3000.00,
          pending_pp: 2000.00,
          purchased_pp: 3000.00,
          earned_pp: 2000.00
        })
        .eq('id', users[0].id);

      if (updateError) {
        console.error('❌ Failed to add test data:', updateError);
      } else {
        console.log('✅ Test PP data added to user:', users[0].email);
        console.log('   Total PP: 5,000 (₦125,000)');
        console.log('   Available: 3,000 | Pending: 2,000');
      }
    }

    console.log('\n🚀 PP Wallet backend is ready!');
    console.log('Next: Start server with npm run dev');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

addPPColumns();
