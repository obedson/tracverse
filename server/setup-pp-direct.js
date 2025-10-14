const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function setupPPDirect() {
  try {
    console.log('🔧 Setting up PP columns directly...');

    // First, let's check current users table structure
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Cannot access users table:', usersError);
      return;
    }

    console.log('✅ Users table accessible');
    
    if (users && users.length > 0) {
      console.log('📋 Current user columns:', Object.keys(users[0]));
      
      // Check if PP columns already exist
      if (users[0].hasOwnProperty('total_pp')) {
        console.log('✅ PP columns already exist!');
        
        // Just update the test data
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
          console.error('❌ Update failed:', updateError);
        } else {
          console.log('✅ Test PP data updated successfully');
          console.log('   User:', users[0].email || 'Unknown');
          console.log('   Total PP: 5,000 (₦125,000)');
        }
      } else {
        console.log('⚠️  PP columns do not exist in users table');
        console.log('💡 You need to add these columns manually in Supabase dashboard:');
        console.log('   - total_pp (numeric, default 0)');
        console.log('   - available_pp (numeric, default 0)');
        console.log('   - pending_pp (numeric, default 0)');
        console.log('   - purchased_pp (numeric, default 0)');
        console.log('   - earned_pp (numeric, default 0)');
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupPPDirect();
