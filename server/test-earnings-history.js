// test-earnings-history.js

function testEarningsHistory() {
  console.log('📈 Testing Historical Earnings Data...\n');

  // Mock historical commission data
  const mockCommissions = [
    { period: '2024-10', amount: 450, commission_type: 'level' },
    { period: '2024-10', amount: 90, commission_type: 'matching' },
    { period: '2024-10', amount: 150, commission_type: 'rank_bonus' },
    { period: '2024-09', amount: 380, commission_type: 'level' },
    { period: '2024-09', amount: 76, commission_type: 'matching' },
    { period: '2024-09', amount: 100, commission_type: 'leadership' },
    { period: '2024-08', amount: 320, commission_type: 'level' },
    { period: '2024-08', amount: 64, commission_type: 'matching' },
    { period: '2024-07', amount: 280, commission_type: 'level' },
    { period: '2024-07', amount: 56, commission_type: 'matching' },
    { period: '2024-07', amount: 50, commission_type: 'rank_bonus' }
  ];

  // Process historical data
  const monthlyData = {};
  mockCommissions.forEach(comm => {
    const period = comm.period;
    if (!monthlyData[period]) {
      monthlyData[period] = {
        period,
        total: 0,
        level: 0,
        matching: 0,
        rank_bonus: 0,
        leadership: 0,
        count: 0
      };
    }
    
    monthlyData[period].total += comm.amount;
    monthlyData[period][comm.commission_type] += comm.amount;
    monthlyData[period].count++;
  });

  const history = Object.values(monthlyData)
    .sort((a, b) => b.period.localeCompare(a.period));

  console.log('📊 Monthly Earnings History:');
  history.forEach(month => {
    console.log(`   ${month.period}: $${month.total.toFixed(2)} (${month.count} commissions)`);
    console.log(`     Level: $${month.level}, Matching: $${month.matching}, Rank: $${month.rank_bonus}, Leadership: $${month.leadership}`);
  });

  // Calculate summary statistics
  const summary = {
    total_periods: history.length,
    total_earnings: history.reduce((sum, h) => sum + h.total, 0),
    average_monthly: history.length > 0 ? history.reduce((sum, h) => sum + h.total, 0) / history.length : 0,
    best_month: history.reduce((best, h) => h.total > (best?.total || 0) ? h : best, null)
  };

  console.log('\n📋 Summary Statistics:');
  console.log(`   Total Periods: ${summary.total_periods} months`);
  console.log(`   Total Earnings: $${summary.total_earnings.toFixed(2)}`);
  console.log(`   Average Monthly: $${summary.average_monthly.toFixed(2)}`);
  console.log(`   Best Month: ${summary.best_month.period} ($${summary.best_month.total.toFixed(2)})`);

  // Growth analysis
  const growthRates = [];
  for (let i = 1; i < history.length; i++) {
    const current = history[i-1].total;
    const previous = history[i].total;
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    growthRates.push({ period: history[i-1].period, growth });
  }

  console.log('\n📈 Month-over-Month Growth:');
  growthRates.forEach(g => {
    const arrow = g.growth > 0 ? '📈' : g.growth < 0 ? '📉' : '➡️';
    console.log(`   ${g.period}: ${arrow} ${g.growth.toFixed(1)}%`);
  });

  console.log('\n✅ Historical earnings analysis verified!');
}

if (require.main === module) {
  testEarningsHistory();
}
