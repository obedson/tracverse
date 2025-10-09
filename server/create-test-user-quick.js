const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createTestUser() {
  try {
    // Create a test user record
    const { data, error } = await supabase
      .from('users')
      .upsert({
        user_id: 'test-user-123',
        email: 'test@example.com',
        referral_code: 'TEST123',
        rank: 'Bronze',
        personal_volume: 1000,
        team_volume: 2500,
        total_earnings: 150,
        active_status: true
      })
      .select();

    if (error) {
      console.error('Error creating test user:', error);
    } else {
      console.log('Test user created:', data);
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestUser();
