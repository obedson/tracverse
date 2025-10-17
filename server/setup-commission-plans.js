require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function setupCommissionPlans() {
  console.log('🚀 Setting up Commission Plans...\n');

  try {
    // Create commission_plans table if it doesn't exist
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS commission_plans (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          membership_tier VARCHAR(50) NOT NULL,
          level INTEGER NOT NULL,
          commission_rate DECIMAL(5,4) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(membership_tier, level)
        );
      `
    });

    if (tableError) {
      console.log('Table creation note:', tableError.message);
    }

    // Insert default commission plans
    const defaultPlans = [
      // Bronze tier (4 levels)
      { membership_tier: 'Bronze', level: 1, commission_rate: 0.0500 },
      { membership_tier: 'Bronze', level: 2, commission_rate: 0.0300 },
      { membership_tier: 'Bronze', level: 3, commission_rate: 0.0200 },
      { membership_tier: 'Bronze', level: 4, commission_rate: 0.0100 },
      
      // Silver tier (5 levels)
      { membership_tier: 'Silver', level: 1, commission_rate: 0.0600 },
      { membership_tier: 'Silver', level: 2, commission_rate: 0.0400 },
      { membership_tier: 'Silver', level: 3, commission_rate: 0.0300 },
      { membership_tier: 'Silver', level: 4, commission_rate: 0.0200 },
      { membership_tier: 'Silver', level: 5, commission_rate: 0.0100 },
      
      // Gold tier (6 levels)
      { membership_tier: 'Gold', level: 1, commission_rate: 0.0700 },
      { membership_tier: 'Gold', level: 2, commission_rate: 0.0500 },
      { membership_tier: 'Gold', level: 3, commission_rate: 0.0400 },
      { membership_tier: 'Gold', level: 4, commission_rate: 0.0300 },
      { membership_tier: 'Gold', level: 5, commission_rate: 0.0200 },
      { membership_tier: 'Gold', level: 6, commission_rate: 0.0100 }
    ];

    const { data, error } = await supabase
      .from('commission_plans')
      .upsert(defaultPlans, { onConflict: 'membership_tier,level' })
      .select();

    if (error) {
      console.error('❌ Insert error:', error.message);
      return;
    }

    console.log('✅ Commission Plans Setup Complete!');
    console.log(`Inserted ${data?.length || 0} commission plan entries`);
    
    // Test the API
    console.log('\n🧪 Testing API...');
    const response = await fetch('http://localhost:3001/api/admin/commission-plans');
    const apiData = await response.json();
    
    console.log('API Response:', JSON.stringify(apiData, null, 2));

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupCommissionPlans();
