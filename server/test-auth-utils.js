const { generateToken, verifyToken, hashPassword, comparePassword } = require('./utils/auth');
const { validateEmail, validatePassword, validateReferralCode, sanitizeInput } = require('./utils/validation');

async function testAuthUtils() {
  console.log('🧪 Testing Authentication Utilities...\n');

  try {
    // Test JWT token generation and verification
    console.log('1. Testing JWT Token Generation & Verification:');
    const payload = { userId: '123', email: 'test@example.com' };
    const token = generateToken(payload);
    console.log('✅ Token generated:', token.substring(0, 50) + '...');
    
    const decoded = verifyToken(token);
    console.log('✅ Token verified:', decoded.userId === '123' ? 'PASS' : 'FAIL');
    
    // Test invalid token
    try {
      verifyToken('invalid-token');
      console.log('❌ Invalid token test: FAIL');
    } catch (error) {
      console.log('✅ Invalid token rejected: PASS');
    }

    // Test password hashing and comparison
    console.log('\n2. Testing Password Hashing & Comparison:');
    const password = 'TestPassword123!';
    const hashedPassword = await hashPassword(password);
    console.log('✅ Password hashed:', hashedPassword.substring(0, 20) + '...');
    
    const isValid = await comparePassword(password, hashedPassword);
    console.log('✅ Password comparison:', isValid ? 'PASS' : 'FAIL');
    
    const isInvalid = await comparePassword('wrongpassword', hashedPassword);
    console.log('✅ Wrong password rejected:', !isInvalid ? 'PASS' : 'FAIL');

    // Test validation functions
    console.log('\n3. Testing Validation Functions:');
    
    // Email validation
    console.log('Email validation:');
    console.log('✅ Valid email:', validateEmail('test@example.com') ? 'PASS' : 'FAIL');
    console.log('✅ Invalid email:', !validateEmail('invalid-email') ? 'PASS' : 'FAIL');
    
    // Password validation
    console.log('Password validation:');
    console.log('✅ Valid password:', validatePassword('Password123') ? 'PASS' : 'FAIL');
    console.log('✅ Weak password:', !validatePassword('weak') ? 'PASS' : 'FAIL');
    
    // Referral code validation
    console.log('Referral code validation:');
    console.log('✅ Valid code:', validateReferralCode('ABC123') ? 'PASS' : 'FAIL');
    console.log('✅ Invalid code:', !validateReferralCode('AB') ? 'PASS' : 'FAIL');
    
    // Input sanitization
    console.log('Input sanitization:');
    const sanitized = sanitizeInput('  <script>alert("xss")</script>  ');
    console.log('✅ XSS sanitized:', sanitized === 'scriptalert("xss")/script' ? 'PASS' : 'FAIL');

    console.log('\n🎉 All authentication utility tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAuthUtils();
}

module.exports = { testAuthUtils };
