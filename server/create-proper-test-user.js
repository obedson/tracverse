const { createClient } = require('@supabase/supabase-js');
const { hashPassword } = require('./utils/auth');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createProperTestUser() {
  try {
    const hashedPassword = await hashPassword('TestPass123!');
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        user_id: 'test-user-123',
        email: 'test@example.com',
        password_hash: hashedPassword,
        referral_code: 'TEST123',
        rank: 'Bronze',
        personal_volume: 1000,
        team_volume: 2500,
        total_earnings: 150,
        active_status: true
      })
      .select();

    console.log('Test user created with password:', data);
    console.log('Login with: test@example.com / TestPass123!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createProperTestUser();
