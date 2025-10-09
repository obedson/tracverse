// Test script to verify backend API integration
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testBackendAPIs() {
  console.log('=== TESTING BACKEND API INTEGRATION ===\n');
  
  try {
    // Test 1: Referral Live Stats API
    console.log('1. Testing getReferralLiveStats...');
    const testReferralCode = 'REF82F24B'; // Use existing code
    
    const statsResponse = await axios.get(`${API_BASE}/referral-dashboard/${testReferralCode}`)
      .catch(err => ({ error: err.response?.status || err.message }));
    
    if (statsResponse.error) {
      console.log('❌ getReferralLiveStats FAILED:', statsResponse.error);
    } else {
      console.log('✅ getReferralLiveStats WORKS');
      console.log('   - Clicks:', statsResponse.data.all_time?.clicks || 0);
      console.log('   - Conversions:', statsResponse.data.all_time?.conversions || 0);
    }
    
    // Test 2: QR Code Generation
    console.log('\n2. Testing QR Code generation...');
    const qrResponse = await axios.post(`${API_BASE}/qr-codes/generate`, {
      referral_code: testReferralCode,
      campaign: 'test'
    }).catch(err => ({ error: err.response?.status || err.message }));
    
    if (qrResponse.error) {
      console.log('❌ QR Code generation FAILED:', qrResponse.error);
    } else {
      console.log('✅ QR Code generation WORKS');
      console.log('   - QR Data length:', qrResponse.data.qr_code_data?.length || 0);
    }
    
    // Test 3: Commissions API
    console.log('\n3. Testing Commissions API...');
    const commResponse = await axios.get(`${API_BASE}/commissions/earnings/test-user-id`)
      .catch(err => ({ error: err.response?.status || err.message }));
    
    if (commResponse.error) {
      console.log('❌ Commissions API FAILED:', commResponse.error);
    } else {
      console.log('✅ Commissions API WORKS');
      console.log('   - Total earnings:', commissions.summary?.total_earnings || 0);
    }
    
    // Test 4: Referrals API
    console.log('\n4. Testing Referrals API...');
    const refResponse = await axios.get(`${API_BASE}/referrals/downline/test-user-id`)
      .catch(err => ({ error: err.response?.status || err.message }));
    
    if (refResponse.error) {
      console.log('❌ Referrals API FAILED:', refResponse.error);
    } else {
      console.log('✅ Referrals API WORKS');
      console.log('   - Team size:', refResponse.data.data?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

testBackendAPIs();
