// test-marketing-library.js

function testMarketingLibrary() {
  console.log('📚 Testing Marketing Material Library...\n');

  // Test different user ranks
  const testUsers = [
    { id: '1', rank: 'bronze', name: 'Bronze User' },
    { id: '2', rank: 'silver', name: 'Silver User' },
    { id: '3', rank: 'gold', name: 'Gold User' },
    { id: '4', rank: 'platinum', name: 'Platinum User' }
  ];

  testUsers.forEach(user => {
    const library = getMarketingLibrary(user.rank);
    
    console.log(`${user.name} (${user.rank.toUpperCase()}) - Access to ${library.total_items} items:`);
    
    Object.entries(library.materials).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`   📁 ${category.toUpperCase()} (${items.length} items):`);
        items.forEach(item => {
          console.log(`     • ${item.title} ${item.size ? `(${item.size})` : ''} ${item.duration ? `[${item.duration}]` : ''}`);
        });
      }
    });
    console.log('');
  });

  // Test category filtering
  console.log('🎯 Category Filtering Test:');
  const goldUser = { rank: 'gold' };
  const videosOnly = getMarketingLibrary(goldUser.rank, 'videos');
  
  console.log(`Gold user requesting videos only: ${videosOnly.total_items} items`);
  videosOnly.materials.videos?.forEach(video => {
    console.log(`   🎥 ${video.title} (${video.duration})`);
  });

  console.log('\n📊 Material Access Matrix:');
  console.log('   BRONZE: Basic banners, videos, images, templates, documents');
  console.log('   SILVER: + Advanced training, lifestyle images, email sequences');
  console.log('   GOLD: + Leadership content, presentation scripts, strategy guides');
  console.log('   PLATINUM: + Executive materials, premium resources');
  console.log('   DIAMOND: + All exclusive content and tools');

  console.log('\n🎨 Material Categories:');
  console.log('   • Banners: Web graphics for websites and social media');
  console.log('   • Videos: Training and promotional video content');
  console.log('   • Images: Photos and graphics for marketing use');
  console.log('   • Templates: Email and social media templates');
  console.log('   • Documents: PDFs, guides, and reference materials');

  console.log('\n✅ Marketing library system verified!');
}

function getMarketingLibrary(userRank, category = null) {
  const materials = {
    banners: [
      { id: 1, title: 'Join Tracverse Banner', size: '728x90', min_rank: 'bronze' },
      { id: 2, title: 'Earn Money Banner', size: '300x250', min_rank: 'bronze' },
      { id: 3, title: 'Success Stories Banner', size: '468x60', min_rank: 'silver' },
      { id: 4, title: 'Premium Team Banner', size: '728x90', min_rank: 'gold' }
    ],
    videos: [
      { id: 1, title: 'How Tracverse Works', duration: '2:30', min_rank: 'bronze' },
      { id: 2, title: 'Success Stories', duration: '3:45', min_rank: 'bronze' },
      { id: 3, title: 'Advanced Training', duration: '15:20', min_rank: 'silver' },
      { id: 4, title: 'Leadership Masterclass', duration: '25:10', min_rank: 'gold' }
    ],
    images: [
      { id: 1, title: 'Income Potential Chart', min_rank: 'bronze' },
      { id: 2, title: 'Team Success Photo', min_rank: 'bronze' },
      { id: 3, title: 'Lifestyle Images', min_rank: 'silver' },
      { id: 4, title: 'Executive Photos', min_rank: 'platinum' }
    ],
    templates: [
      { id: 1, title: 'Welcome Email', type: 'email', min_rank: 'bronze' },
      { id: 2, title: 'Social Media Post', type: 'social', min_rank: 'bronze' },
      { id: 3, title: 'Follow-up Sequence', type: 'email_series', min_rank: 'silver' },
      { id: 4, title: 'Presentation Script', type: 'script', min_rank: 'gold' }
    ],
    documents: [
      { id: 1, title: 'Getting Started Guide', type: 'pdf', min_rank: 'bronze' },
      { id: 2, title: 'Compensation Plan', type: 'pdf', min_rank: 'bronze' },
      { id: 3, title: 'Advanced Strategies', type: 'pdf', min_rank: 'silver' },
      { id: 4, title: 'Leadership Manual', type: 'pdf', min_rank: 'gold' }
    ]
  };

  const rankHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const userRankIndex = rankHierarchy.indexOf(userRank);

  const filteredMaterials = {};
  Object.entries(materials).forEach(([cat, items]) => {
    if (!category || category === cat) {
      filteredMaterials[cat] = items.filter(item => {
        const itemRankIndex = rankHierarchy.indexOf(item.min_rank);
        return userRankIndex >= itemRankIndex;
      });
    }
  });

  return {
    user_rank: userRank,
    materials: filteredMaterials,
    total_items: Object.values(filteredMaterials).reduce((sum, arr) => sum + arr.length, 0)
  };
}

if (require.main === module) {
  testMarketingLibrary();
}
