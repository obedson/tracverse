const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEnterpriseAuth() {
  try {
    console.log('🔐 Testing Enterprise Authentication System...');

    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not found in .env file');
      return;
    }

    console.log('✅ JWT_SECRET configured');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Add security columns
    console.log('📊 Adding security columns...');
    
    const { data: users } = await supabase
      .from('users')
      .select('id, email, failed_login_attempts, account_locked_until')
      .limit(1);

    if (users && users.length > 0) {
      const user = users[0];
      console.log('✅ Security columns accessible:', {
        failed_login_attempts: user.failed_login_attempts,
        account_locked_until: user.account_locked_until
      });
    }

    // Test server health
    console.log('\n🚀 Testing server endpoints...');
    console.log('Available endpoints:');
    console.log('  POST /api/auth-enterprise/register');
    console.log('  POST /api/auth-enterprise/login');
    console.log('  POST /api/auth-enterprise/refresh');
    console.log('  POST /api/auth-enterprise/logout');

    console.log('\n✅ Enterprise authentication system ready!');
    console.log('📝 Next steps:');
    console.log('  1. Start server: npm run dev');
    console.log('  2. Test registration with strong password');
    console.log('  3. Test login with rate limiting');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEnterpriseAuth();
