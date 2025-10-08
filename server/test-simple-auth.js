require('dotenv').config();

async function testSimpleAuth() {
  console.log('🧪 Testing Simple Authentication...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Test registration
    console.log('1. Testing Registration...');
    const registerResponse = await fetch('http://localhost:3000/api/auth-fixed/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const registerText = await registerResponse.text();
    console.log('Response status:', registerResponse.status);
    console.log('Response body:', registerText);

    if (registerResponse.ok) {
      const registerData = JSON.parse(registerText);
      console.log('✅ Registration successful!');
      console.log('User ID:', registerData.user.id);
      console.log('Token:', registerData.token ? 'Present' : 'Missing');
    } else {
      console.log('❌ Registration failed');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testSimpleAuth();
