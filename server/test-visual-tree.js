// test-visual-tree.js
require('dotenv').config();
const mlmService = require('./services/mlmService');

async function testVisualTree() {
  console.log('🌳 Testing Visual Tree Representation...\n');

  try {
    const timestamp = Date.now();
    
    // Create root user
    const root = await mlmService.registerWithReferral({
      email: `root-${timestamp}@tree-test.com`,
      password: 'test123'
    });

    // Create level 1 users
    const level1Users = [];
    for (let i = 0; i < 3; i++) {
      const user = await mlmService.registerWithReferral({
        email: `level1-${i}-${timestamp}@tree-test.com`,
        password: 'test123'
      }, root.user.referral_code);
      level1Users.push(user);
    }

    // Create level 2 users under first level 1 user
    for (let i = 0; i < 2; i++) {
      await mlmService.registerWithReferral({
        email: `level2-${i}-${timestamp}@tree-test.com`,
        password: 'test123'
      }, level1Users[0].user.referral_code);
    }

    console.log('✅ Test tree structure created:');
    console.log(`   Root: ${root.user.referral_code}`);
    console.log(`   Level 1: 3 users`);
    console.log(`   Level 2: 2 users under first L1 user`);

    // Generate visual tree
    console.log('\n🌳 Generating visual tree...');
    const tree = await mlmService.getVisualTree(root.user.id, 3);

    // Display tree structure
    console.log('\n📊 Tree Structure:');
    displayTree(tree, 0);

    // Verify structure
    console.log('\n🔍 Verification:');
    console.log(`   Root children: ${tree.children.length} (expected: 3)`);
    console.log(`   First child's children: ${tree.children[0]?.children?.length || 0} (expected: 2)`);
    console.log(`   Total nodes: ${countNodes(tree)}`);

    console.log('\n✅ Visual tree test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function displayTree(node, level) {
  const indent = '  '.repeat(level);
  const status = node.active_status ? '🟢' : '🔴';
  console.log(`${indent}${status} ${node.email} (${node.rank}) - $${node.personal_volume}`);
  
  node.children?.forEach(child => displayTree(child, level + 1));
}

function countNodes(node) {
  if (!node) return 0;
  return 1 + (node.children || []).reduce((sum, child) => sum + countNodes(child), 0);
}

if (require.main === module) {
  testVisualTree();
}
