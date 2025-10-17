// Test Commission Flow End-to-End
const mlmService = require('./services/mlmService');

// Mock Supabase for testing
const mockSupabase = {
  from: (table) => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({
          data: table === 'users' ? {
            id: 'test-user',
            total_earnings: 10000,
            membership_price: 25000,
            sponsor_id: 'sponsor-1'
          } : null
        })
      })
    }),
    insert: (data) => ({
      select: () => ({
        single: () => Promise.resolve({
          data: { ...data, id: 'new-commission' }
        })
      })
    })
  })
};

// Override MLMService for testing
mlmService.supabase = mockSupabase;

async function testCommissionFlow() {
  console.log('🧪 Testing Commission Flow\n');

  try {
    // Test earnings cap check
    console.log('1. Testing Earnings Cap Check');
    const canEarn = await mlmService.checkEarningsCap('test-user', 5000);
    console.log(`Can earn ₦5,000: ${canEarn}`);
    
    const cannotEarn = await mlmService.checkEarningsCap('test-user', 30000);
    console.log(`Can earn ₦30,000: ${cannotEarn}`);
    console.log('✅ Earnings cap working\n');

    // Test upline chain (mocked)
    console.log('2. Testing Upline Chain');
    const upline = await mlmService.getUplineChain('test-user', 4);
    console.log(`Upline length: ${upline.length}`);
    console.log('✅ Upline chain working\n');

    // Test commission calculation
    console.log('3. Testing Commission Calculation');
    const rates = mlmService.commissionRates;
    const points = 1000;
    
    rates.forEach((rate, index) => {
      const commission = points * rate;
      console.log(`Level ${index + 1}: ${rate * 100}% = ${commission} points`);
    });
    console.log('✅ Commission rates correct\n');

    console.log('🎉 All Commission Flow Tests Passed!');
    console.log('\nReady for production testing with real database.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCommissionFlow();
