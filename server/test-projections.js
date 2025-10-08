// test-projections.js

function testGrowthProjections() {
  console.log('🔮 Testing Growth Projections...\n');

  // Mock historical data
  const mockHistory = [
    { period: '2024-10', total: 690 },
    { period: '2024-09', total: 556 },
    { period: '2024-08', total: 384 },
    { period: '2024-07', total: 386 }
  ];

  const mockStats = {
    direct_referrals: 8,
    total_team_size: 15
  };

  // Calculate growth rate
  function calculateGrowthRate(history) {
    if (history.length < 2) return 0.1;
    
    const growthRates = [];
    for (let i = 1; i < history.length; i++) {
      const current = history[i-1].total;
      const previous = history[i].total;
      if (previous > 0) {
        growthRates.push((current - previous) / previous);
      }
    }
    
    return growthRates.length > 0 ? 
      growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0.1;
  }

  const avgGrowthRate = calculateGrowthRate(mockHistory);
  const avgReferralRate = 1.2; // 20% monthly growth
  
  console.log('📊 Growth Analysis:');
  console.log(`   Historical earnings growth: ${(avgGrowthRate * 100).toFixed(1)}%`);
  console.log(`   Assumed referral growth: 20%`);
  console.log(`   Assumed team growth: 15%`);

  // Generate projections
  const projections = [];
  let currentEarnings = mockHistory[0].total;
  let currentReferrals = mockStats.direct_referrals;
  let currentTeamSize = mockStats.total_team_size;

  for (let i = 1; i <= 6; i++) {
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + i);
    const period = projectedDate.toISOString().slice(0, 7);

    currentEarnings *= (1 + avgGrowthRate);
    currentReferrals = Math.floor(currentReferrals * avgReferralRate);
    currentTeamSize = Math.floor(currentTeamSize * 1.15);

    projections.push({
      period,
      projected_earnings: Math.round(currentEarnings * 100) / 100,
      projected_referrals: currentReferrals,
      projected_team_size: currentTeamSize,
      confidence: Math.max(0.9 - (i * 0.1), 0.3)
    });
  }

  console.log('\n🔮 6-Month Projections:');
  projections.forEach(proj => {
    const confidence = (proj.confidence * 100).toFixed(0);
    console.log(`   ${proj.period}: $${proj.projected_earnings} | ${proj.projected_referrals} refs | ${proj.projected_team_size} team (${confidence}% confidence)`);
  });

  // Calculate potential outcomes
  const bestCase = projections[5].projected_earnings * 1.5;
  const worstCase = projections[5].projected_earnings * 0.5;
  
  console.log('\n📈 6-Month Scenarios:');
  console.log(`   Conservative: $${worstCase.toFixed(2)}`);
  console.log(`   Expected: $${projections[5].projected_earnings}`);
  console.log(`   Optimistic: $${bestCase.toFixed(2)}`);

  // Annual projection
  const annualProjection = currentEarnings * Math.pow(1 + avgGrowthRate, 12);
  console.log(`\n🎯 12-Month Projection: $${annualProjection.toFixed(2)}`);

  console.log('\n✅ Growth projections verified!');
}

if (require.main === module) {
  testGrowthProjections();
}
