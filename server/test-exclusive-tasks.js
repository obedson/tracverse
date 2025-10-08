// test-exclusive-tasks.js
require('dotenv').config();
const mlmService = require('./services/mlmService');
const { supabase } = require('./config/supabase');

async function testExclusiveTasks() {
  console.log('🎯 Testing Exclusive Task Access...\n');

  try {
    const timestamp = Date.now();
    
    // Create users with different ranks
    const bronzeUser = await mlmService.registerWithReferral({
      email: `bronze-${timestamp}@task-test.com`,
      password: 'test123'
    });

    const goldUser = await mlmService.registerWithReferral({
      email: `gold-${timestamp}@task-test.com`,
      password: 'test123'
    });

    // Set Gold rank
    await supabase
      .from('users')
      .update({ rank: 'gold' })
      .eq('id', goldUser.user.id);

    console.log(`✅ Bronze user: ${bronzeUser.user.referral_code}`);
    console.log(`✅ Gold user: ${goldUser.user.referral_code}`);

    // Get available tasks for each user
    console.log('\n📋 Available tasks by rank:');
    
    const bronzeTasks = await mlmService.getExclusiveTasks(bronzeUser.user.id);
    const goldTasks = await mlmService.getExclusiveTasks(goldUser.user.id);

    console.log(`   Bronze user can access: ${bronzeTasks.length} tasks`);
    bronzeTasks.forEach(task => {
      console.log(`     - ${task.title} (${task.minimum_rank}, ${task.points_reward} pts)`);
    });

    console.log(`   Gold user can access: ${goldTasks.length} tasks`);
    goldTasks.forEach(task => {
      console.log(`     - ${task.title} (${task.minimum_rank}, ${task.points_reward} pts)`);
    });

    // Test task completion
    const goldTask = goldTasks.find(t => t.minimum_rank === 'gold');
    if (goldTask) {
      console.log(`\n💰 Gold user completing: ${goldTask.title}`);
      
      const result = await mlmService.completeExclusiveTask(goldUser.user.id, goldTask.id);
      console.log(`   ✅ Earned ${result.points_earned} points`);
      console.log(`   ✅ Generated ${result.commissions.length} commissions`);
    }

    // Test access restriction
    console.log('\n🚫 Testing access restriction...');
    try {
      const diamondTask = await supabase
        .from('exclusive_tasks')
        .select('*')
        .eq('minimum_rank', 'diamond')
        .single();

      if (diamondTask.data) {
        await mlmService.completeExclusiveTask(bronzeUser.user.id, diamondTask.data.id);
        console.log('   ❌ Bronze user should not access Diamond task');
      }
    } catch (error) {
      console.log(`   ✅ Access correctly restricted: ${error.message}`);
    }

    console.log('\n🎉 Exclusive tasks test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testExclusiveTasks();
}
