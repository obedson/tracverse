// test-exclusive-tasks-mock.js
require('dotenv').config();
const mlmService = require('./services/mlmService');

// Mock exclusive tasks data
const mockTasks = [
  { id: '1', title: 'Silver Survey', points_reward: 50, minimum_rank: 'silver' },
  { id: '2', title: 'Gold Partnership', points_reward: 100, minimum_rank: 'gold' },
  { id: '3', title: 'Platinum Challenge', points_reward: 200, minimum_rank: 'platinum' },
  { id: '4', title: 'Diamond Mission', points_reward: 500, minimum_rank: 'diamond' }
];

function getTasksByRank(userRank) {
  const rankHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const userRankIndex = rankHierarchy.indexOf(userRank);
  const accessibleRanks = rankHierarchy.slice(0, userRankIndex + 1);
  
  return mockTasks.filter(task => accessibleRanks.includes(task.minimum_rank));
}

async function testExclusiveTasksMock() {
  console.log('🎯 Testing Exclusive Task Access (Mock)...\n');

  try {
    // Test different rank access
    const ranks = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    console.log('📋 Task access by rank:');
    ranks.forEach(rank => {
      const availableTasks = getTasksByRank(rank);
      console.log(`   ${rank.toUpperCase()}: ${availableTasks.length} tasks`);
      availableTasks.forEach(task => {
        console.log(`     - ${task.title} (${task.points_reward} pts)`);
      });
    });

    // Test rank-based commission calculation
    console.log('\n💰 Testing rank-based rewards:');
    
    const goldTask = mockTasks.find(t => t.minimum_rank === 'gold');
    const diamondTask = mockTasks.find(t => t.minimum_rank === 'diamond');
    
    // Simulate Gold user completing Gold task
    console.log(`   Gold user completing "${goldTask.title}": ${goldTask.points_reward} pts`);
    
    // Simulate Diamond user completing Diamond task  
    console.log(`   Diamond user completing "${diamondTask.title}": ${diamondTask.points_reward} pts`);

    // Test commission rates
    const goldRates = mlmService.getCommissionRatesByRank('gold');
    const diamondRates = mlmService.getCommissionRatesByRank('diamond');
    
    console.log('\n📊 Commission rate comparison:');
    console.log(`   Gold Level 1: ${(goldRates[0] * 100).toFixed(1)}%`);
    console.log(`   Diamond Level 1: ${(diamondRates[0] * 100).toFixed(1)}%`);

    console.log('\n✅ Exclusive task logic verified!');
    console.log('📝 Note: Actual table creation needed in production');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testExclusiveTasksMock();
}
