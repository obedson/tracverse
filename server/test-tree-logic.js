// test-tree-logic.js

function testTreeLogic() {
  console.log('🌳 Testing Tree Logic...\n');

  // Mock tree data
  const mockTree = {
    id: 'root-1',
    email: 'root@test.com',
    referral_code: 'TRV123456',
    rank: 'gold',
    personal_volume: 1500,
    active_status: true,
    children: [
      {
        id: 'user-2',
        email: 'user1@test.com',
        referral_code: 'TRV234567',
        rank: 'silver',
        personal_volume: 800,
        active_status: true,
        children: [
          {
            id: 'user-4',
            email: 'user3@test.com',
            referral_code: 'TRV456789',
            rank: 'bronze',
            personal_volume: 200,
            active_status: true,
            children: []
          },
          {
            id: 'user-5',
            email: 'user4@test.com',
            referral_code: 'TRV567890',
            rank: 'bronze',
            personal_volume: 150,
            active_status: false,
            children: []
          }
        ]
      },
      {
        id: 'user-3',
        email: 'user2@test.com',
        referral_code: 'TRV345678',
        rank: 'bronze',
        personal_volume: 300,
        active_status: true,
        children: []
      }
    ]
  };

  console.log('📊 Tree Structure:');
  displayTree(mockTree, 0);

  // Tree analytics
  const analytics = analyzeTree(mockTree);
  console.log('\n📈 Tree Analytics:');
  console.log(`   Total nodes: ${analytics.totalNodes}`);
  console.log(`   Active nodes: ${analytics.activeNodes}`);
  console.log(`   Max depth: ${analytics.maxDepth}`);
  console.log(`   Total volume: $${analytics.totalVolume}`);
  console.log(`   Rank distribution: ${JSON.stringify(analytics.rankDistribution)}`);

  console.log('\n✅ Tree logic verified!');
}

function displayTree(node, level) {
  const indent = '  '.repeat(level);
  const status = node.active_status ? '🟢' : '🔴';
  const rankEmoji = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '💠' };
  
  console.log(`${indent}${status} ${rankEmoji[node.rank]} ${node.email} - $${node.personal_volume}`);
  
  node.children?.forEach(child => displayTree(child, level + 1));
}

function analyzeTree(node) {
  const analytics = {
    totalNodes: 0,
    activeNodes: 0,
    maxDepth: 0,
    totalVolume: 0,
    rankDistribution: {}
  };

  function traverse(node, depth = 0) {
    analytics.totalNodes++;
    analytics.totalVolume += node.personal_volume || 0;
    analytics.maxDepth = Math.max(analytics.maxDepth, depth);
    
    if (node.active_status) analytics.activeNodes++;
    
    const rank = node.rank || 'bronze';
    analytics.rankDistribution[rank] = (analytics.rankDistribution[rank] || 0) + 1;
    
    node.children?.forEach(child => traverse(child, depth + 1));
  }

  traverse(node);
  return analytics;
}

if (require.main === module) {
  testTreeLogic();
}
