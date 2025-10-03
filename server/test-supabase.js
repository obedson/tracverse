const { supabase } = require('./config/supabase');

async function testConnection() {
  try {
    // Test fetching utm_config
    const { data, error } = await supabase
      .from('utm_config')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    
    console.log('✅ Supabase connected successfully!');
    console.log('Active UTM Config:', data);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
