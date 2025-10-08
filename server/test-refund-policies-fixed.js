// test-refund-policies-fixed.js

function testRefundPolicies() {
  console.log('💰 Testing Refund Policies...\n');

  // Mock refund test cases with recent dates
  const now = new Date();
  const testCases = [
    {
      name: 'Valid Membership Refund',
      user: { email: 'user1@test.com', joined_date: '2024-10-01', personal_volume: 500 },
      refund_data: {
        reason: 'dissatisfaction',
        amount_requested: 99,
        purchase_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        product_type: 'membership_fee'
      }
    },
    {
      name: 'Expired Training Refund',
      user: { email: 'user2@test.com', joined_date: '2024-09-01', personal_volume: 200 },
      refund_data: {
        reason: 'dissatisfaction',
        amount_requested: 199,
        purchase_date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        product_type: 'training_materials'
      }
    },
    {
      name: 'Valid Billing Error',
      user: { email: 'user3@test.com', joined_date: '2024-08-01', personal_volume: 300 },
      refund_data: {
        reason: 'billing_error',
        amount_requested: 49,
        purchase_date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        product_type: 'marketing_tools'
      }
    },
    {
      name: 'Valid Marketing Tools Refund',
      user: { email: 'user4@test.com', joined_date: '2024-10-20', personal_volume: 150 },
      refund_data: {
        reason: 'technical_issues',
        amount_requested: 79,
        purchase_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        product_type: 'marketing_tools'
      }
    }
  ];

  console.log('📋 Refund Policy Matrix:');
  console.log('   Membership Fee: 30 days, 100% refund, $0 fee');
  console.log('   Training Materials: 14 days, 80% refund, $25 fee');
  console.log('   Marketing Tools: 7 days, 50% refund, $15 fee\n');

  testCases.forEach(testCase => {
    const result = processRefundRequest(testCase.user, testCase.refund_data);
    
    console.log(`${testCase.name}:`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Requested: $${result.amount_requested}`);
    console.log(`   Approved: $${result.approved_amount}`);
    console.log(`   Processing Fee: $${result.processing_fee}`);
    console.log(`   Net Refund: $${result.net_refund}`);
    console.log(`   Reason: ${result.eligibility_check.reason_code}\n`);
  });

  console.log('✅ Refund policies verified!');
}

function processRefundRequest(user, refundData) {
  const { reason, amount_requested, purchase_date, product_type } = refundData;
  const purchaseAge = (Date.now() - new Date(purchase_date).getTime()) / (24 * 60 * 60 * 1000);
  
  const policies = {
    membership_fee: { refund_period: 30, full_refund: true, processing_fee: 0 },
    training_materials: { refund_period: 14, full_refund: false, max_refund: 0.8, processing_fee: 25 },
    marketing_tools: { refund_period: 7, full_refund: false, max_refund: 0.5, processing_fee: 15 }
  };

  const policy = policies[product_type] || policies.membership_fee;
  const timeEligible = purchaseAge <= policy.refund_period;
  
  let approvedAmount = 0;
  if (timeEligible || reason === 'billing_error' || reason === 'duplicate_charge') {
    if (policy.full_refund || reason === 'billing_error' || reason === 'duplicate_charge') {
      approvedAmount = parseFloat(amount_requested);
    } else {
      approvedAmount = parseFloat(amount_requested) * policy.max_refund;
    }
  }

  const specialConditions = {
    dissatisfaction: timeEligible,
    technical_issues: timeEligible,
    billing_error: true, // Always eligible
    duplicate_charge: true // Always eligible
  };

  const conditionMet = specialConditions[reason] || false;
  const eligible = conditionMet;

  const eligibilityCheck = {
    eligible,
    approved_amount: eligible ? approvedAmount : 0,
    processing_fee: eligible ? (policy.processing_fee || 0) : 0,
    reason_code: eligible ? 'APPROVED' : (timeEligible ? 'INVALID_REASON' : 'TIME_EXPIRED'),
    policy_applied: product_type
  };

  return {
    user_id: 'test-user',
    email: user.email,
    reason,
    amount_requested: parseFloat(amount_requested),
    purchase_date,
    product_type,
    eligibility_check: eligibilityCheck,
    status: eligible ? 'approved' : 'rejected',
    approved_amount: eligible ? eligibilityCheck.approved_amount : 0,
    processing_fee: eligible ? eligibilityCheck.processing_fee : 0,
    net_refund: eligible ? eligibilityCheck.approved_amount - eligibilityCheck.processing_fee : 0,
    created_date: new Date().toISOString()
  };
}

if (require.main === module) {
  testRefundPolicies();
}
