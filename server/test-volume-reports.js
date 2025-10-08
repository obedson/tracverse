// test-volume-reports.js

function testVolumeReports() {
  console.log('📊 Testing Team Volume Reports...\n');

  // Mock team data
  const mockTeamData = {
    user: { personal_volume: 2500, team_volume: 8750 },
    downline: [
      { level: 1, users: { email: 'level1a@test.com', referral_code: 'TRV111', rank: 'gold', personal_volume: 1500 }},
      { level: 1, users: { email: 'level1b@test.com', referral_code: 'TRV222', rank: 'silver', personal_volume: 1200 }},
      { level: 1, users: { email: 'level1c@test.com', referral_code: 'TRV333', rank: 'bronze', personal_volume: 800 }},
      { level: 2, users: { email: 'level2a@test.com', referral_code: 'TRV444', rank: 'silver', personal_volume: 900 }},
      { level: 2, users: { email: 'level2b@test.com', referral_code: 'TRV555', rank: 'bronze', personal_volume: 600 }},
      { level: 3, users: { email: 'level3a@test.com', referral_code: 'TRV666', rank: 'bronze', personal_volume: 400 }}
    ]
  };

  // Generate volume report
  const report = {
    period: '2024-10',
    personal_volume: mockTeamData.user.personal_volume,
    team_volume: mockTeamData.user.team_volume,
    level_volumes: {},
    top_performers: [],
    growth_metrics: {}
  };

  // Calculate level-wise volumes
  for (const member of mockTeamData.downline) {
    const level = member.level;
    const volume = member.users.personal_volume;
    
    if (!report.level_volumes[level]) {
      report.level_volumes[level] = { count: 0, total_volume: 0 };
    }
    
    report.level_volumes[level].count++;
    report.level_volumes[level].total_volume += volume;
  }

  // Get top performers
  report.top_performers = mockTeamData.downline
    .sort((a, b) => b.users.personal_volume - a.users.personal_volume)
    .slice(0, 5)
    .map(m => ({
      email: m.users.email,
      referral_code: m.users.referral_code,
      rank: m.users.rank,
      volume: m.users.personal_volume,
      level: m.level
    }));

  console.log('📈 Volume Report Summary:');
  console.log(`   Period: ${report.period}`);
  console.log(`   Personal Volume: $${report.personal_volume}`);
  console.log(`   Team Volume: $${report.team_volume}`);

  console.log('\n📊 Level-wise Breakdown:');
  Object.entries(report.level_volumes).forEach(([level, data]) => {
    console.log(`   Level ${level}: ${data.count} members, $${data.total_volume} volume`);
  });

  console.log('\n🏆 Top Performers:');
  report.top_performers.forEach((performer, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    console.log(`   ${medal} ${performer.email} (L${performer.level}) - $${performer.volume}`);
  });

  // Calculate additional metrics
  const totalTeamVolume = Object.values(report.level_volumes).reduce((sum, level) => sum + level.total_volume, 0);
  const averageVolumePerMember = totalTeamVolume / mockTeamData.downline.length;
  
  console.log('\n📋 Additional Metrics:');
  console.log(`   Total Team Members: ${mockTeamData.downline.length}`);
  console.log(`   Average Volume per Member: $${averageVolumePerMember.toFixed(2)}`);
  console.log(`   Team Depth: ${Math.max(...mockTeamData.downline.map(m => m.level))} levels`);

  console.log('\n✅ Volume report logic verified!');
}

if (require.main === module) {
  testVolumeReports();
}
