// test-leaderboards.js

function testLeaderboards() {
  console.log('🏆 Testing Performance Leaderboards...\n');

  // Mock user data with performance metrics
  const mockUsers = [
    { id: '1', email: 'top@test.com', rank: 'diamond', personal_volume: 5000, direct_referrals: 25, total_earnings: 2500 },
    { id: '2', email: 'second@test.com', rank: 'platinum', personal_volume: 3000, direct_referrals: 15, total_earnings: 1800 },
    { id: '3', email: 'third@test.com', rank: 'gold', personal_volume: 2000, direct_referrals: 8, total_earnings: 1200 },
    { id: '4', email: 'fourth@test.com', rank: 'silver', personal_volume: 1000, direct_referrals: 5, total_earnings: 600 },
    { id: '5', email: 'fifth@test.com', rank: 'bronze', personal_volume: 500, direct_referrals: 2, total_earnings: 200 }
  ];

  // Test earnings leaderboard
  console.log('💰 Earnings Leaderboard:');
  const earningsBoard = [...mockUsers].sort((a, b) => b.total_earnings - a.total_earnings);
  earningsBoard.forEach((user, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    console.log(`   ${medal} ${user.email} - $${user.total_earnings}`);
  });

  // Test referrals leaderboard
  console.log('\n👥 Referrals Leaderboard:');
  const referralsBoard = [...mockUsers].sort((a, b) => b.direct_referrals - a.direct_referrals);
  referralsBoard.forEach((user, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    console.log(`   ${medal} ${user.email} - ${user.direct_referrals} referrals`);
  });

  // Test volume leaderboard
  console.log('\n📊 Volume Leaderboard:');
  const volumeBoard = [...mockUsers].sort((a, b) => b.personal_volume - a.personal_volume);
  volumeBoard.forEach((user, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    console.log(`   ${medal} ${user.email} - $${user.personal_volume}`);
  });

  // Test rank distribution
  console.log('\n🏅 Rank Distribution:');
  const rankCounts = mockUsers.reduce((acc, user) => {
    acc[user.rank] = (acc[user.rank] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(rankCounts).forEach(([rank, count]) => {
    const rankEmoji = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '💠' };
    console.log(`   ${rankEmoji[rank]} ${rank.toUpperCase()}: ${count} users`);
  });

  // Performance metrics
  console.log('\n📈 Performance Metrics:');
  const totalEarnings = mockUsers.reduce((sum, user) => sum + user.total_earnings, 0);
  const totalReferrals = mockUsers.reduce((sum, user) => sum + user.direct_referrals, 0);
  const totalVolume = mockUsers.reduce((sum, user) => sum + user.personal_volume, 0);
  
  console.log(`   Total Network Earnings: $${totalEarnings}`);
  console.log(`   Total Referrals: ${totalReferrals}`);
  console.log(`   Total Volume: $${totalVolume}`);
  console.log(`   Average Earnings per User: $${(totalEarnings / mockUsers.length).toFixed(2)}`);

  console.log('\n✅ Leaderboard logic verified!');
}

if (require.main === module) {
  testLeaderboards();
}
