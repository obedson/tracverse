const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const testUser = {
      email: 'test@tracverse.com',
      password: 'Test123!',
      email_confirm: true,
      user_metadata: {
        referral_code: 'TEST001',
        rank: 'Bronze',
        personal_volume: 0,
        team_volume: 0,
        total_earnings: 0,
        active_status: true
      }
    };

    const { data, error } = await supabase.auth.admin.createUser(testUser);

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Password:', testUser.password);
    console.log('🆔 User ID:', data.user.id);
    console.log('🔗 Referral Code:', testUser.user_metadata.referral_code);

  } catch (error) {
    console.error('Failed to create test user:', error);
  }
}

createTestUser();
