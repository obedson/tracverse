// Simple test to verify API connection
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testConnection() {
  try {
    console.log('Testing API connection to:', API_BASE_URL);
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test registration endpoint
    const testUser = {
      email: 'test-' + Date.now() + '@example.com',
      password: 'TestPass123'
    };
    
    console.log('Testing registration with:', testUser.email);
    const registerResponse = await axios.post(`${API_BASE_URL}/auth-fixed/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data);
    
  } catch (error) {
    console.error('❌ API Connection Error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testConnection();
