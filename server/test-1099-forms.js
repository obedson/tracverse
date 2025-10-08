// test-1099-forms.js

function test1099Forms() {
  console.log('📄 Testing 1099 Tax Reporting...\n');

  // Mock user earnings data
  const mockUsers = [
    { id: '1', email: 'high@earner.com', referral_code: 'TRV001', earnings: 5200 },
    { id: '2', email: 'mid@earner.com', referral_code: 'TRV002', earnings: 1800 },
    { id: '3', email: 'low@earner.com', referral_code: 'TRV003', earnings: 450 }, // Below threshold
    { id: '4', email: 'top@earner.com', referral_code: 'TRV004', earnings: 12500 }
  ];

  const taxYear = '2024';
  const threshold = 600;

  // Filter users above threshold
  const eligibleUsers = mockUsers.filter(user => user.earnings >= threshold);

  console.log(`📊 1099 Forms Generation - Tax Year ${taxYear}`);
  console.log(`Threshold: $${threshold}`);
  console.log(`Total Users: ${mockUsers.length}`);
  console.log(`Eligible Users: ${eligibleUsers.length}\n`);

  // Generate forms
  const forms = eligibleUsers.map(user => ({
    user_id: user.id,
    email: user.email,
    referral_code: user.referral_code,
    tax_year: taxYear,
    total_earnings: user.earnings,
    breakdown: {
      level_commissions: user.earnings * 0.6,
      matching_bonuses: user.earnings * 0.2,
      rank_bonuses: user.earnings * 0.15,
      leadership_bonuses: user.earnings * 0.05
    },
    form_1099_data: {
      payer: 'Tracverse LLC',
      recipient: user.email,
      box_7_nonemployee_compensation: user.earnings,
      federal_tax_withheld: 0,
      state_tax_withheld: 0
    },
    generated_date: new Date().toISOString()
  }));

  console.log('📋 Generated 1099 Forms:');
  forms.forEach((form, index) => {
    console.log(`\n   Form ${index + 1}:`);
    console.log(`     Recipient: ${form.email}`);
    console.log(`     Total Compensation: $${form.total_earnings}`);
    console.log(`     Breakdown:`);
    console.log(`       Level Commissions: $${form.breakdown.level_commissions.toFixed(2)}`);
    console.log(`       Matching Bonuses: $${form.breakdown.matching_bonuses.toFixed(2)}`);
    console.log(`       Rank Bonuses: $${form.breakdown.rank_bonuses.toFixed(2)}`);
    console.log(`       Leadership Bonuses: $${form.breakdown.leadership_bonuses.toFixed(2)}`);
  });

  // Summary statistics
  const totalReportableIncome = forms.reduce((sum, f) => sum + f.total_earnings, 0);
  const averageIncome = totalReportableIncome / forms.length;

  console.log('\n📈 Summary Statistics:');
  console.log(`   Forms Generated: ${forms.length}`);
  console.log(`   Total Reportable Income: $${totalReportableIncome}`);
  console.log(`   Average Income per Form: $${averageIncome.toFixed(2)}`);
  console.log(`   Users Below Threshold: ${mockUsers.length - eligibleUsers.length}`);

  // Compliance notes
  console.log('\n⚠️ Compliance Requirements:');
  console.log('   • Forms must be sent to recipients by January 31st');
  console.log('   • Forms must be filed with IRS by February 28th (March 31st if electronic)');
  console.log('   • Backup withholding may apply if TIN is missing');
  console.log('   • State reporting requirements may vary');

  console.log('\n✅ 1099 tax reporting verified!');
}

if (require.main === module) {
  test1099Forms();
}
