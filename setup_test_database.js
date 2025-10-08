const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function setupTestDatabase() {
  try {
    console.log('🔍 Checking database state...');
    
    // 1. Check current database state
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('📋 Checking tables via RPC...');
    }

    // 2. Check existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    console.log(`👥 Current users: ${users?.users?.length || 0}`);

    // 3. Create test users using Supabase Auth
    console.log('🏗️ Creating test users...');
    
    const testUsers = [
      {
        email: 'sponsor@tracverse.com',
        password: 'Test123!',
        user_metadata: {
          referral_code: 'SPONSOR001',
          rank: 'Diamond',
          personal_volume: 5000,
          team_volume: 50000,
          total_earnings: 15000,
          active_status: true
        }
      },
      {
        email: 'user1@tracverse.com', 
        password: 'Test123!',
        user_metadata: {
          referral_code: 'USER001',
          rank: 'Gold',
          sponsor_code: 'SPONSOR001',
          personal_volume: 3000,
          team_volume: 15000,
          total_earnings: 4500,
          active_status: true
        }
      },
      {
        email: 'user2@tracverse.com',
        password: 'Test123!', 
        user_metadata: {
          referral_code: 'USER002',
          rank: 'Silver',
          sponsor_code: 'SPONSOR001',
          personal_volume: 2000,
          team_volume: 8000,
          total_earnings: 2400,
          active_status: true
        }
      }
    ];

    for (const user of testUsers) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.user_metadata
      });

      if (error && !error.message.includes('already registered')) {
        console.error(`❌ Error creating ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created user: ${user.email}`);
      }
    }

    // 4. Create commission test data
    console.log('💰 Creating test commissions...');
    
    const { data: newUsers } = await supabase.auth.admin.listUsers();
    const userMap = {};
    newUsers.users.forEach(u => {
      if (u.email.includes('tracverse.com')) {
        userMap[u.email] = u.id;
      }
    });

    if (Object.keys(userMap).length > 0) {
      const testCommissions = [
        {
          user_id: userMap['user1@tracverse.com'],
          from_user_id: userMap['user2@tracverse.com'],
          amount: 100.00,
          type: 'direct',
          level: 1,
          status: 'paid'
        },
        {
          user_id: userMap['user1@tracverse.com'],
          from_user_id: userMap['sponsor@tracverse.com'],
          amount: 50.00,
          type: 'override', 
          level: 2,
          status: 'pending'
        },
        {
          user_id: userMap['sponsor@tracverse.com'],
          from_user_id: userMap['user1@tracverse.com'],
          amount: 75.00,
          type: 'leadership',
          level: 1,
          status: 'paid'
        }
      ];

      for (const commission of testCommissions) {
        const { error } = await supabase
          .from('commissions')
          .insert(commission);
        
        if (error) {
          console.log('💡 Commission insert failed (table may not exist):', error.message);
        } else {
          console.log('✅ Created commission:', commission.type);
        }
      }
    }

    console.log('🎉 Test database setup complete!');
    console.log('📧 Test login: user1@tracverse.com / Test123!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupTestDatabase();
