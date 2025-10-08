const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAuthRoutes() {
  console.log('🧪 Testing Authentication Routes...\n');
  
  const baseUrl = 'http://localhost:3000/api/auth';
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let authToken = null;
  let userId = null;

  try {
    // Test 1: Register new user
    console.log('1. Testing User Registration:');
    
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ User registration: PASS');
      console.log('   - User ID:', registerData.user.id);
      console.log('   - Referral Code:', registerData.user.referral_code);
      authToken = registerData.token;
      userId = registerData.user.id;
    } else {
      const error = await registerResponse.json();
      console.log('❌ User registration: FAIL -', error.error);
      return;
    }

    // Test 2: Duplicate registration should fail
    console.log('\n2. Testing Duplicate Registration:');
    
    const duplicateResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (duplicateResponse.status === 409) {
      console.log('✅ Duplicate registration rejected: PASS');
    } else {
      console.log('❌ Duplicate registration should fail: FAIL');
    }

    // Test 3: Login with correct credentials
    console.log('\n3. Testing User Login:');
    
    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ User login: PASS');
      console.log('   - Token received:', loginData.token ? 'YES' : 'NO');
      authToken = loginData.token;
    } else {
      const error = await loginResponse.json();
      console.log('❌ User login: FAIL -', error.error);
    }

    // Test 4: Login with wrong password
    console.log('\n4. Testing Wrong Password:');
    
    const wrongPasswordResponse = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'wrongpassword'
      })
    });

    if (wrongPasswordResponse.status === 401) {
      console.log('✅ Wrong password rejected: PASS');
    } else {
      console.log('❌ Wrong password should fail: FAIL');
    }

    // Test 5: Token verification
    console.log('\n5. Testing Token Verification:');
    
    const verifyResponse = await fetch(`${baseUrl}/verify`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Token verification: PASS');
      console.log('   - User verified:', verifyData.user.email === testEmail ? 'YES' : 'NO');
    } else {
      const error = await verifyResponse.json();
      console.log('❌ Token verification: FAIL -', error.error);
    }

    // Test 6: Invalid token
    console.log('\n6. Testing Invalid Token:');
    
    const invalidTokenResponse = await fetch(`${baseUrl}/verify`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });

    if (invalidTokenResponse.status === 403) {
      console.log('✅ Invalid token rejected: PASS');
    } else {
      console.log('❌ Invalid token should fail: FAIL');
    }

    // Test 7: Input validation
    console.log('\n7. Testing Input Validation:');
    
    // Invalid email
    const invalidEmailResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: testPassword
      })
    });

    if (invalidEmailResponse.status === 400) {
      console.log('✅ Invalid email rejected: PASS');
    } else {
      console.log('❌ Invalid email should fail: FAIL');
    }

    // Weak password
    const weakPasswordResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `weak-${Date.now()}@example.com`,
        password: 'weak'
      })
    });

    if (weakPasswordResponse.status === 400) {
      console.log('✅ Weak password rejected: PASS');
    } else {
      console.log('❌ Weak password should fail: FAIL');
    }

    console.log('\n🎉 All authentication route tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup: Delete test user
    if (userId) {
      console.log('\n🧹 Cleaning up test data...');
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.log('⚠️  Cleanup warning:', error.message);
      } else {
        console.log('✅ Test user deleted');
      }
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAuthRoutes();
}

module.exports = { testAuthRoutes };
