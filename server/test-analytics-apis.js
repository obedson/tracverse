const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 GET ${endpoint}`);
    
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || 'Network Error'}`);
    console.log(`📄 Error Response:`, error.response?.data || error.message);
    
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing New Analytics APIs');
  console.log('================================');
  
  const tests = [
    ['/analytics/team-performance', 'Team Performance Metrics'],
    ['/analytics/rank-distribution', 'Rank Distribution Data'],
    ['/analytics/top-performers', 'Top Performers List'],
    ['/analytics/activity-timeline', 'Activity Timeline'],
    ['/analytics/team-reports', 'Team Reports'],
    ['/analytics/performance-comparison', 'Performance Comparison'],
    ['/referrals/stats', 'Team Stats (Auth Required)'],
    ['/referrals-mock', 'Mock Referrals (No Auth)']
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [endpoint, description] of tests) {
    const success = await testAPI(endpoint, description);
    if (success) passed++;
  }
  
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All APIs are working correctly!');
  } else {
    console.log('⚠️  Some APIs need authentication or have issues');
  }
}

runTests().catch(console.error);
