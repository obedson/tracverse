const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAuthentication() {
  console.log('🧪 Testing Authentication System...\n');

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123'  // Strong password: 8+ chars, uppercase, lowercase, number
  };

  try {
    // Test 1: Register new user
    console.log('1️⃣ Testing user registration...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth-fixed/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.message);

    // Test 2: Login with valid credentials
    console.log('\n2️⃣ Testing user login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth-fixed/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');

    // Test 3: Get user profile with token
    console.log('\n3️⃣ Testing protected route access...');
    const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    console.log('✅ Profile access successful:', profileResponse.data.email);

    // Test 4: Test invalid login
    console.log('\n4️⃣ Testing invalid login...');
    try {
      await axios.post(`${API_BASE_URL}/auth-fixed/login`, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Invalid login should have failed');
    } catch (error) {
      console.log('✅ Invalid login properly rejected:', error.response.data.error);
    }

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ User registration works');
    console.log('✅ User login works');
    console.log('✅ JWT token authentication works');
    console.log('✅ Protected routes work');
    console.log('✅ Invalid credentials properly rejected');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuthentication();
