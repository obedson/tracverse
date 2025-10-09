const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createTestReferrals() {
  try {
    // Create test referrals for the test user
    const { data, error } = await supabase
      .from('users')
      .upsert([
        {
          user_id: 'test-referral-1',
          email: 'referral1@example.com',
          referral_code: 'REF001',
          sponsor_id: 'caf975aa-6635-400b-a588-4fae087e4740', // UUID of test-user-123
          rank: 'Bronze',
          personal_volume: 500,
          team_volume: 500,
          total_earnings: 50,
          active_status: true
        },
        {
          user_id: 'test-referral-2',
          email: 'referral2@example.com',
          referral_code: 'REF002',
          sponsor_id: 'caf975aa-6635-400b-a588-4fae087e4740', // UUID of test-user-123
          rank: 'Silver',
          personal_volume: 800,
          team_volume: 1200,
          total_earnings: 120,
          active_status: true
        }
      ])
      .select();

    if (error) {
      console.error('Error creating test referrals:', error);
    } else {
      console.log('Test referrals created:', data);
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestReferrals();
