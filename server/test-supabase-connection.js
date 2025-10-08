// test-supabase-connection.js
require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection...\n');

  try {
    // Test 1: Check environment variables
    console.log('1. Checking environment variables...');
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');

    // Test 2: Simple query to existing table
    console.log('\n2. Testing connection with simple query...');
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }

    console.log('✅ Connection successful!');
    console.log('   Users table row count:', count);

    // Test 3: Try to insert a test record
    console.log('\n3. Testing insert operation...');
    const testUser = {
      user_id: 'test_connection_' + Date.now(),
      email: 'test@connection.com',
      password: 'test123'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('   This might be due to missing columns - check if migration was run');
      return;
    }

    console.log('✅ Insert successful!');
    console.log('   Created user ID:', insertData.id || insertData.user_id);

    // Clean up test record
    await supabase
      .from('users')
      .delete()
      .eq('user_id', testUser.user_id);

    console.log('\n🎉 Supabase connection is working correctly!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run test
testSupabaseConnection();
