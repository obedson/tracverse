require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAuthIntegration() {
  console.log('🧪 Testing Complete Authentication Integration...\n');
  
  const baseUrl = 'http://localhost:3000/api';
  const testEmail = `integration-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let authToken = null;
  let userId = null;

  try {
    // Test 1: User Registration
    console.log('1. Testing User Registration:');
    
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful');
      console.log('   - User ID:', registerData.user.id);
      console.log('   - Referral Code:', registerData.user.referral_code);
      console.log('   - Token received:', registerData.token ? 'YES' : 'NO');
      
      authToken = registerData.token;
      userId = registerData.user.id;
    } else {
      const error = await registerResponse.json();
      console.log('❌ Registration failed:', error.error);
      return;
    }

    // Test 2: Login
    console.log('\n2. Testing User Login:');
    
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log('   - User verified:', loginData.user.email === testEmail ? 'YES' : 'NO');
      authToken = loginData.token; // Use fresh token
    } else {
      const error = await loginResponse.json();
      console.log('❌ Login failed:', error.error);
    }

    // Test 3: Token Verification
    console.log('\n3. Testing Token Verification:');
    
    const verifyResponse = await fetch(`${baseUrl}/auth/verify`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Token verification successful');
      console.log('   - User data returned:', verifyData.user ? 'YES' : 'NO');
    } else {
      const error = await verifyResponse.json();
      console.log('❌ Token verification failed:', error.error);
    }

    // Test 4: Protected Route - User Profile
    console.log('\n4. Testing Protected Route (User Profile):');
    
    const profileResponse = await fetch(`${baseUrl}/users/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ Profile access successful');
      console.log('   - Email matches:', profileData.user.email === testEmail ? 'YES' : 'NO');
      console.log('   - Referral code present:', profileData.user.referral_code ? 'YES' : 'NO');
    } else {
      const error = await profileResponse.json();
      console.log('❌ Profile access failed:', error.error);
    }

    // Test 5: Dashboard Data
    console.log('\n5. Testing Dashboard Data:');
    
    const dashboardResponse = await fetch(`${baseUrl}/users/dashboard`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard data retrieved');
      console.log('   - User info:', dashboardData.user ? 'YES' : 'NO');
      console.log('   - Metrics:', dashboardData.metrics ? 'YES' : 'NO');
      console.log('   - Recent activity:', Array.isArray(dashboardData.recentActivity) ? 'YES' : 'NO');
    } else {
      const error = await dashboardResponse.json();
      console.log('❌ Dashboard data failed:', error.error);
    }

    // Test 6: Profile Update
    console.log('\n6. Testing Profile Update:');
    
    const updateEmail = `updated-${Date.now()}@example.com`;
    const updateResponse = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: updateEmail })
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Profile update successful');
      console.log('   - Email updated:', updateData.user.email === updateEmail ? 'YES' : 'NO');
    } else {
      const error = await updateResponse.json();
      console.log('❌ Profile update failed:', error.error);
    }

    // Test 7: Password Change
    console.log('\n7. Testing Password Change:');
    
    const newPassword = 'NewPassword456!';
    const passwordResponse = await fetch(`${baseUrl}/users/password`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        currentPassword: testPassword,
        newPassword: newPassword
      })
    });

    if (passwordResponse.ok) {
      console.log('✅ Password change successful');
      
      // Test login with new password
      const newLoginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: updateEmail,
          password: newPassword
        })
      });

      if (newLoginResponse.ok) {
        console.log('✅ Login with new password successful');
      } else {
        console.log('❌ Login with new password failed');
      }
    } else {
      const error = await passwordResponse.json();
      console.log('❌ Password change failed:', error.error);
    }

    // Test 8: Unauthorized Access
    console.log('\n8. Testing Unauthorized Access:');
    
    const unauthorizedResponse = await fetch(`${baseUrl}/users/profile`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });

    if (unauthorizedResponse.status === 403) {
      console.log('✅ Unauthorized access properly blocked');
    } else {
      console.log('❌ Unauthorized access should be blocked');
    }

    console.log('\n🎉 All authentication integration tests completed!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
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
  testAuthIntegration();
}

module.exports = { testAuthIntegration };
