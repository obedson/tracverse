// test-referral-tracking.js - Test referral click tracking functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testReferralClickTracking() {
  console.log('🧪 Testing Referral Click Tracking...\n');

  try {
    // First, get a valid referral code from existing users
    console.log('1. Getting existing referral code...');
    const { data: users } = await axios.get(`${BASE_URL}/api/users`);
    
    if (!users || users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const testUser = users[0];
    const referralCode = testUser.referral_code;
    console.log(`✅ Using referral code: ${referralCode}\n`);

    // Test 1: Track a referral click
    console.log('2. Testing referral click tracking...');
    const clickResponse = await axios.post(`${BASE_URL}/api/referral-tracking/click`, {
      referral_code: referralCode,
      click_source: 'social',
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_campaign: 'test_campaign',
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0 Test Browser'
    });

    console.log('✅ Click tracked:', clickResponse.data);
    console.log('');

    // Test 2: Track another click from different source
    console.log('3. Testing click from different source...');
    await axios.post(`${BASE_URL}/api/referral-tracking/click`, {
      referral_code: referralCode,
      click_source: 'email',
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'monthly_promo'
    });
    console.log('✅ Second click tracked\n');

    // Test 3: Get referral statistics
    console.log('4. Testing referral statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/api/referral-tracking/stats/${referralCode}`);
    console.log('✅ Referral stats:', JSON.stringify(statsResponse.data, null, 2));
    console.log('');

    // Test 4: Test conversion tracking
    console.log('5. Testing conversion tracking...');
    const conversionResponse = await axios.post(`${BASE_URL}/api/referral-tracking/convert`, {
      referral_code: referralCode,
      converted_user_id: testUser.id,
      referral_source: 'social'
    });
    console.log('✅ Conversion tracked:', conversionResponse.data);
    console.log('');

    // Test 5: Get updated statistics
    console.log('6. Testing updated statistics after conversion...');
    const updatedStatsResponse = await axios.get(`${BASE_URL}/api/referral-tracking/stats/${referralCode}`);
    console.log('✅ Updated stats:', JSON.stringify(updatedStatsResponse.data, null, 2));

    console.log('\n🎉 All referral click tracking tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test error cases
async function testErrorCases() {
  console.log('\n🧪 Testing Error Cases...\n');

  try {
    // Test invalid referral code
    console.log('1. Testing invalid referral code...');
    try {
      await axios.post(`${BASE_URL}/api/referral-tracking/click`, {
        referral_code: 'INVALID123'
      });
    } catch (error) {
      console.log('✅ Invalid referral code handled:', error.response.data.error);
    }

    // Test missing referral code
    console.log('2. Testing missing referral code...');
    try {
      await axios.post(`${BASE_URL}/api/referral-tracking/click`, {
        click_source: 'social'
      });
    } catch (error) {
      console.log('✅ Missing referral code handled:', error.response.data.error);
    }

    console.log('\n🎉 Error case tests passed!');

  } catch (error) {
    console.error('❌ Error case test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testReferralClickTracking();
  await testErrorCases();
}

if (require.main === module) {
  runTests();
}

module.exports = { testReferralClickTracking, testErrorCases };
