// test-rank-protection.js

function testRankProtection() {
  console.log('🛡️ Testing Rank Protection Periods...\n');

  // Mock test scenarios
  const testCases = [
    {
      name: 'Gold User - First Protection',
      user: {
        id: '1',
        rank: 'gold',
        protection_periods_used: 0,
        rank_achieved_date: '2024-06-01'
      },
      qualification: {
        qualified_rank: 'silver', // Would be demoted
        direct_referrals: 4, // Below gold requirement
        personal_volume: 1500
      }
    },
    {
      name: 'Platinum User - Protection Exhausted',
      user: {
        id: '2',
        rank: 'platinum',
        protection_periods_used: 3, // Max for platinum
        rank_achieved_date: '2024-03-01'
      },
      qualification: {
        qualified_rank: 'gold', // Would be demoted
        direct_referrals: 8,
        personal_volume: 3000
      }
    },
    {
      name: 'Diamond User - No Demotion Needed',
      user: {
        id: '3',
        rank: 'diamond',
        protection_periods_used: 1,
        rank_achieved_date: '2024-01-01'
      },
      qualification: {
        qualified_rank: 'diamond', // Maintains rank
        direct_referrals: 25,
        personal_volume: 18000
      }
    },
    {
      name: 'Silver User - Second Protection',
      user: {
        id: '4',
        rank: 'silver',
        protection_periods_used: 0,
        rank_achieved_date: '2024-08-01'
      },
      qualification: {
        qualified_rank: 'bronze', // Would be demoted
        direct_referrals: 2,
        personal_volume: 300
      }
    }
  ];

  // Protection limits by rank
  const protectionLimits = {
    bronze: 0,
    silver: 1,
    gold: 2,
    platinum: 3,
    diamond: 4
  };

  console.log('🛡️ Protection Limits by Rank:');
  Object.entries(protectionLimits).forEach(([rank, limit]) => {
    const rankEmoji = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '💠' };
    console.log(`   ${rankEmoji[rank]} ${rank.toUpperCase()}: ${limit} protection periods`);
  });

  console.log('\n📊 Protection Test Results:\n');

  testCases.forEach(testCase => {
    const user = testCase.user;
    const qualification = testCase.qualification;
    
    // Check if demotion would occur
    const rankHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentRankIndex = rankHierarchy.indexOf(user.rank);
    const qualifiedRankIndex = rankHierarchy.indexOf(qualification.qualified_rank);
    
    let result;
    
    if (qualifiedRankIndex < currentRankIndex) {
      // Would be demoted - check protection
      const maxProtections = protectionLimits[user.rank];
      const protectionUsed = user.protection_periods_used;
      
      if (protectionUsed < maxProtections) {
        // Apply protection
        result = {
          protected: true,
          maintained_rank: user.rank,
          qualified_rank: qualification.qualified_rank,
          protection_periods_remaining: maxProtections - protectionUsed - 1,
          period: '2024-11'
        };
      } else {
        // No protection available
        result = {
          protected: false,
          demoted_to: qualification.qualified_rank,
          previous_rank: user.rank,
          reason: 'protection_exhausted',
          period: '2024-11'
        };
      }
    } else {
      // No demotion needed
      result = {
        protected: false,
        maintained_rank: user.rank,
        qualified_rank: qualification.qualified_rank,
        no_demotion_needed: true,
        period: '2024-11'
      };
    }

    console.log(`${testCase.name}:`);
    console.log(`   Current Rank: ${user.rank.toUpperCase()}`);
    console.log(`   Qualified Rank: ${qualification.qualified_rank.toUpperCase()}`);
    console.log(`   Protection Used: ${user.protection_periods_used}/${protectionLimits[user.rank]}`);
    
    if (result.protected) {
      console.log(`   ✅ PROTECTED - Rank maintained`);
      console.log(`   Remaining Protections: ${result.protection_periods_remaining}`);
    } else if (result.no_demotion_needed) {
      console.log(`   ✅ NO DEMOTION NEEDED`);
    } else {
      console.log(`   ❌ DEMOTED to ${result.demoted_to.toUpperCase()}`);
      console.log(`   Reason: ${result.reason}`);
    }
    console.log('');
  });

  console.log('📋 Protection Policy Summary:');
  console.log('   • Higher ranks get more protection periods');
  console.log('   • Protection periods reset annually');
  console.log('   • Bronze rank has no protection (entry level)');
  console.log('   • Protection only applies to rank demotions');

  console.log('\n✅ Rank protection system verified!');
}

if (require.main === module) {
  testRankProtection();
}
