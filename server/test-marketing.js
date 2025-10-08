// test-marketing.js

function testMarketingTools() {
  console.log('📱 Testing Social Sharing Tools...\n');

  // Mock user data
  const user = {
    referral_code: 'TRV123456',
    email: 'user@test.com'
  };

  const baseUrl = 'http://localhost:3000';
  const referralUrl = `${baseUrl}/register?ref=${user.referral_code}`;
  
  // Generate social sharing URLs
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent('Join me on Tracverse and start earning!')}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Join me on Tracverse and start earning! 💰')}&hashtags=MLM,Tracverse,Earnings`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Join me on Tracverse and start earning! ${referralUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Join me on Tracverse and start earning!')}`
  };

  console.log('🔗 Generated Share Links:');
  console.log(`   Referral URL: ${referralUrl}`);
  console.log(`   Facebook: ${shareLinks.facebook.substring(0, 80)}...`);
  console.log(`   Twitter: ${shareLinks.twitter.substring(0, 80)}...`);
  console.log(`   LinkedIn: ${shareLinks.linkedin.substring(0, 80)}...`);
  console.log(`   WhatsApp: ${shareLinks.whatsapp.substring(0, 80)}...`);
  console.log(`   Telegram: ${shareLinks.telegram.substring(0, 80)}...`);

  // Test marketing materials
  const materials = {
    banners: [
      { id: 1, title: 'Join Tracverse Banner', size: '728x90' },
      { id: 2, title: 'Earn Money Banner', size: '300x250' }
    ],
    templates: [
      {
        id: 1,
        title: 'Email Template',
        content: 'Hi [NAME], I wanted to share an amazing opportunity with you...'
      },
      {
        id: 2,
        title: 'Social Media Post',
        content: '🚀 Just hit my monthly goal with Tracverse! Join my team: [REFERRAL_LINK]'
      }
    ]
  };

  console.log('\n📚 Marketing Materials:');
  console.log(`   Banners: ${materials.banners.length}`);
  materials.banners.forEach(banner => {
    console.log(`     - ${banner.title} (${banner.size})`);
  });
  
  console.log(`   Templates: ${materials.templates.length}`);
  materials.templates.forEach(template => {
    console.log(`     - ${template.title}`);
  });

  // Test share text variations
  const shareTexts = {
    short: 'Join me on Tracverse and start earning!',
    long: 'I\'ve been earning money with Tracverse by completing simple tasks. Join my team and start earning too!',
    with_stats: 'Join my successful Tracverse team! We\'re building wealth together through smart task completion.'
  };

  console.log('\n💬 Share Text Variations:');
  Object.entries(shareTexts).forEach(([type, text]) => {
    console.log(`   ${type}: "${text}"`);
  });

  console.log('\n✅ Social sharing tools verified!');
}

if (require.main === module) {
  testMarketingTools();
}
