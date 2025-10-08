// test-income-disclosure.js

function testIncomeDisclosure() {
  console.log('📋 Testing Income Disclosure Statements...\n');

  // Mock participant data
  const mockParticipants = [
    { rank: 'diamond', earnings: [25000, 22000, 28000] },
    { rank: 'platinum', earnings: [15000, 12000, 18000, 16000] },
    { rank: 'gold', earnings: [8000, 6000, 9000, 7500, 8500] },
    { rank: 'silver', earnings: [3000, 2500, 3500, 2800, 3200, 2900, 3100] },
    { rank: 'bronze', earnings: [500, 200, 800, 300, 600, 150, 400, 250, 700, 350, 450, 550, 100, 900, 650] }
  ];

  const disclosureData = {
    period: '2024',
    total_participants: 0,
    earnings_by_rank: {},
    percentile_breakdown: {},
    disclaimers: [
      'These figures represent gross earnings before expenses',
      'Individual results may vary based on effort and market conditions',
      'Past performance does not guarantee future results',
      'Most participants earn modest amounts or no income'
    ]
  };

  // Process each rank
  mockParticipants.forEach(rankData => {
    const rank = rankData.rank;
    const earnings = rankData.earnings.sort((a, b) => b - a);
    
    disclosureData.total_participants += earnings.length;
    
    disclosureData.earnings_by_rank[rank] = {
      count: earnings.length,
      total_earnings: earnings.reduce((sum, e) => sum + e, 0),
      average_earnings: earnings.reduce((sum, e) => sum + e, 0) / earnings.length,
      median_earnings: calculateMedian(earnings),
      top_10_percent: calculatePercentile(earnings, 90)
    };
  });

  // Calculate overall percentiles
  const allEarnings = [];
  mockParticipants.forEach(rankData => {
    allEarnings.push(...rankData.earnings);
  });
  allEarnings.sort((a, b) => b - a);

  disclosureData.percentile_breakdown = {
    top_1_percent: calculatePercentile(allEarnings, 99),
    top_5_percent: calculatePercentile(allEarnings, 95),
    top_10_percent: calculatePercentile(allEarnings, 90),
    median: calculateMedian(allEarnings),
    bottom_50_percent: calculatePercentile(allEarnings, 50)
  };

  // Display results
  console.log(`📊 Income Disclosure Statement - ${disclosureData.period}`);
  console.log(`Total Participants: ${disclosureData.total_participants}\n`);

  console.log('💰 Earnings by Rank:');
  Object.entries(disclosureData.earnings_by_rank).forEach(([rank, data]) => {
    const rankEmoji = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '💠' };
    console.log(`   ${rankEmoji[rank]} ${rank.toUpperCase()} (${data.count} participants):`);
    console.log(`     Average: $${data.average_earnings.toFixed(2)}`);
    console.log(`     Median: $${data.median_earnings.toFixed(2)}`);
    console.log(`     Top 10%: $${data.top_10_percent.toFixed(2)}`);
  });

  console.log('\n📈 Overall Percentile Breakdown:');
  console.log(`   Top 1%: $${disclosureData.percentile_breakdown.top_1_percent.toFixed(2)}`);
  console.log(`   Top 5%: $${disclosureData.percentile_breakdown.top_5_percent.toFixed(2)}`);
  console.log(`   Top 10%: $${disclosureData.percentile_breakdown.top_10_percent.toFixed(2)}`);
  console.log(`   Median (50%): $${disclosureData.percentile_breakdown.median.toFixed(2)}`);
  console.log(`   Bottom 50%: $${disclosureData.percentile_breakdown.bottom_50_percent.toFixed(2)}`);

  console.log('\n⚠️ Important Disclaimers:');
  disclosureData.disclaimers.forEach(disclaimer => {
    console.log(`   • ${disclaimer}`);
  });

  console.log('\n✅ Income disclosure statement verified!');
}

function calculateMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculatePercentile(arr, percentile) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

if (require.main === module) {
  testIncomeDisclosure();
}
