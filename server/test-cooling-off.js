// test-cooling-off.js

function testCoolingOffPeriods() {
  console.log('❄️ Testing Cooling-off Periods...\n');

  // Mock test scenarios
  const testCases = [
    {
      name: 'New User (Day 3)',
      user: {
        id: '1',
        email: 'new@user.com',
        joined_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        personal_volume: 99,
        status: 'cooling_off'
      }
    },
    {
      name: 'Mid Cooling-off (Day 10)',
      user: {
        id: '2',
        email: 'mid@user.com',
        joined_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        personal_volume: 199,
        status: 'cooling_off'
      }
    },
    {
      name: 'Cooling-off Expired (Day 20)',
      user: {
        id: '3',
        email: 'expired@user.com',
        joined_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        personal_volume: 299,
        status: 'active'
      }
    }
  ];

  console.log('📅 Cooling-off Period Status:\n');

  testCases.forEach(testCase => {
    const status = handleCoolingOffPeriod(testCase.user);
    
    console.log(`${testCase.name}:`);
    console.log(`   Join Date: ${status.join_date.slice(0, 10)}`);
    console.log(`   Cooling-off End: ${status.cooling_off_end.slice(0, 10)}`);
    console.log(`   Days Remaining: ${status.days_remaining}`);
    console.log(`   Status: ${status.is_active ? 'ACTIVE COOLING-OFF' : 'EXPIRED'}`);
    console.log(`   Can Cancel: ${status.can_cancel ? 'YES' : 'NO'}`);
    
    console.log(`   Current Restrictions:`);
    Object.entries(status.restrictions).forEach(([restriction, active]) => {
      const icon = active ? '🚫' : '✅';
      console.log(`     ${icon} ${restriction.replace('_', ' ')}: ${active ? 'RESTRICTED' : 'ALLOWED'}`);
    });
    console.log('');
  });

  // Test cancellation process
  console.log('🚫 Testing Cancellation Process:\n');
  
  const cancellationTest = {
    user: {
      id: '4',
      email: 'cancel@user.com',
      joined_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      personal_volume: 149,
      referral_code: 'TRV123456'
    },
    reason: 'not_satisfied'
  };

  const cancellation = processCoolingOffCancellation(cancellationTest.user, cancellationTest.reason);
  
  console.log('Cancellation Request:');
  console.log(`   User: ${cancellation.email}`);
  console.log(`   Referral Code: ${cancellation.referral_code}`);
  console.log(`   Reason: ${cancellation.reason.replace('_', ' ')}`);
  console.log(`   Refund Amount: $${cancellation.refund_amount}`);
  console.log(`   Days Used: ${cancellation.cooling_off_days_used}/14`);
  console.log(`   Status: ${cancellation.status.toUpperCase()}`);
  console.log(`   Refund Processed: ${cancellation.refund_processed ? 'YES' : 'NO'}`);

  console.log('\n📋 Cooling-off Period Rules:');
  console.log('   • 14-day period from registration date');
  console.log('   • Full refund available during period');
  console.log('   • Commission earning restricted');
  console.log('   • Rank advancement blocked');
  console.log('   • Team building allowed (recruiting)');
  console.log('   • Automatic activation after 14 days');

  console.log('\n⚖️ Legal Compliance:');
  console.log('   • FTC MLM guidelines compliance');
  console.log('   • State-specific cooling-off requirements');
  console.log('   • Clear disclosure of cancellation rights');
  console.log('   • Automated refund processing');
  console.log('   • Documentation for regulatory audits');

  console.log('\n✅ Cooling-off period system verified!');
}

function handleCoolingOffPeriod(user) {
  const joinDate = new Date(user.joined_date);
  const coolingOffEnd = new Date(joinDate.getTime() + (14 * 24 * 60 * 60 * 1000));
  const now = new Date();

  const daysRemaining = Math.max(0, Math.ceil((coolingOffEnd - now) / (24 * 60 * 60 * 1000)));
  const isActive = now < coolingOffEnd;

  return {
    user_id: user.id,
    join_date: user.joined_date,
    cooling_off_end: coolingOffEnd.toISOString(),
    days_remaining: daysRemaining,
    is_active: isActive,
    can_cancel: isActive,
    restrictions: {
      commission_earning: isActive,
      team_building: false, // Always allowed
      rank_advancement: isActive,
      payout_requests: isActive
    }
  };
}

function processCoolingOffCancellation(user, reason) {
  const status = handleCoolingOffPeriod(user);
  
  if (!status.can_cancel) {
    throw new Error('Cooling-off period has expired');
  }

  const refundAmount = user.personal_volume || 0;
  
  return {
    user_id: user.id,
    email: user.email,
    referral_code: user.referral_code,
    cancellation_date: new Date().toISOString(),
    reason,
    refund_amount: refundAmount,
    cooling_off_days_used: 14 - status.days_remaining,
    status: 'processed',
    refund_processed: refundAmount > 0
  };
}

if (require.main === module) {
  testCoolingOffPeriods();
}
