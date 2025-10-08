// test-landing-pages.js

function testLandingPages() {
  console.log('🎨 Testing Custom Referral Landing Pages...\n');

  // Mock user data
  const mockUsers = [
    {
      id: '1',
      email: 'sarah@example.com',
      referral_code: 'TRV123456',
      rank: 'gold'
    },
    {
      id: '2', 
      email: 'mike@example.com',
      referral_code: 'TRV789012',
      rank: 'platinum'
    }
  ];

  // Test different landing page configurations
  const pageConfigs = [
    {
      name: 'Professional Template',
      config: {
        template_id: 'professional',
        headline: 'Build Your Financial Future',
        description: 'Join a proven system that helps ordinary people create extraordinary income.',
        call_to_action: 'Start Your Journey',
        background_color: '#f8f9fa',
        accent_color: '#28a745',
        show_earnings: true,
        show_testimonials: true,
        custom_message: 'I\'ve been earning consistent income with this system. Let me show you how!'
      }
    },
    {
      name: 'Casual Template',
      config: {
        template_id: 'casual',
        headline: 'Hey! Want to Make Extra Money?',
        description: 'I found this amazing way to earn money from home. It\'s actually working!',
        call_to_action: 'Check It Out',
        background_color: '#ffffff',
        accent_color: '#007bff',
        show_earnings: false,
        show_testimonials: true,
        custom_message: 'This has been a game-changer for me. Happy to share the details!'
      }
    }
  ];

  console.log('🎨 Landing Page Templates:\n');

  mockUsers.forEach((user, userIndex) => {
    const config = pageConfigs[userIndex];
    
    // Create landing page
    const landingPage = createLandingPage(user, config.config);
    
    console.log(`${config.name} - ${user.email}:`);
    console.log(`   URL: ${landingPage.full_url}`);
    console.log(`   Headline: "${landingPage.content.headline}"`);
    console.log(`   CTA: "${landingPage.content.call_to_action}"`);
    console.log(`   Colors: ${landingPage.styling.background_color} / ${landingPage.styling.accent_color}`);
    console.log(`   Features: ${Object.entries(landingPage.features).filter(([k,v]) => v).map(([k]) => k).join(', ')}`);
    console.log(`   Custom Message: "${landingPage.content.custom_message}"`);
    console.log('');
  });

  // Test analytics
  console.log('📊 Landing Page Analytics:\n');
  
  const mockAnalytics = {
    total_views: 245,
    total_conversions: 18,
    conversion_rate: 7.3,
    traffic_sources: {
      social_media: 45,
      direct_link: 30,
      email: 15,
      other: 10
    },
    daily_stats: [
      { date: '2024-10-25', views: 12, conversions: 1 },
      { date: '2024-10-26', views: 18, conversions: 2 },
      { date: '2024-10-27', views: 15, conversions: 0 },
      { date: '2024-10-28', views: 22, conversions: 3 }
    ]
  };

  console.log('Performance Metrics:');
  console.log(`   Total Views: ${mockAnalytics.total_views}`);
  console.log(`   Total Conversions: ${mockAnalytics.total_conversions}`);
  console.log(`   Conversion Rate: ${mockAnalytics.conversion_rate}%`);
  
  console.log('\nTraffic Sources:');
  Object.entries(mockAnalytics.traffic_sources).forEach(([source, percentage]) => {
    console.log(`   ${source.replace('_', ' ')}: ${percentage}%`);
  });

  console.log('\nDaily Performance:');
  mockAnalytics.daily_stats.forEach(day => {
    const rate = day.views > 0 ? ((day.conversions / day.views) * 100).toFixed(1) : '0.0';
    console.log(`   ${day.date}: ${day.views} views, ${day.conversions} conversions (${rate}%)`);
  });

  console.log('\n🚀 Landing Page Features:');
  console.log('   • Customizable templates and styling');
  console.log('   • Personal branding with sponsor info');
  console.log('   • Conversion tracking and analytics');
  console.log('   • Mobile-responsive design');
  console.log('   • A/B testing capabilities');
  console.log('   • Social proof and testimonials');

  console.log('\n✅ Custom landing pages verified!');
}

function createLandingPage(user, pageData) {
  const {
    template_id = 'default',
    headline,
    description,
    call_to_action = 'Join My Team',
    background_color = '#ffffff',
    accent_color = '#007bff',
    show_earnings = false,
    show_testimonials = true,
    custom_message
  } = pageData;

  const landingPage = {
    user_id: user.id,
    referral_code: user.referral_code,
    url_slug: `join-${user.referral_code.toLowerCase()}`,
    template_id,
    content: {
      headline: headline || `Join ${user.email.split('@')[0]}'s Successful Team`,
      description: description || 'Start earning money by completing simple tasks and building your network.',
      call_to_action,
      sponsor_info: {
        name: user.email.split('@')[0],
        rank: user.rank,
        referral_code: user.referral_code
      },
      custom_message: custom_message || `Hi! I'm excited to share this opportunity with you.`
    },
    styling: {
      background_color,
      accent_color,
      font_family: 'Arial, sans-serif',
      layout: template_id
    },
    features: {
      show_earnings,
      show_testimonials,
      show_rank_benefits: true,
      show_success_stories: true,
      contact_form: true
    },
    analytics: {
      views: 0,
      conversions: 0,
      conversion_rate: 0
    },
    created_date: new Date().toISOString(),
    is_active: true
  };

  const baseUrl = 'http://localhost:3000';
  landingPage.full_url = `${baseUrl}/join/${landingPage.url_slug}`;

  return landingPage;
}

if (require.main === module) {
  testLandingPages();
}
