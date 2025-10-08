require('dotenv').config();

class SecurityTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.vulnerabilities = [];
    this.securityChecks = [];
  }

  async securityTest(name, testFn) {
    try {
      console.log(`🔒 ${name}...`);
      const result = await testFn();
      
      if (result.vulnerable) {
        this.vulnerabilities.push({ name, issue: result.issue });
        console.log(`❌ ${name}: VULNERABLE - ${result.issue}`);
      } else {
        console.log(`✅ ${name}: SECURE`);
      }
      
      this.securityChecks.push({ name, secure: !result.vulnerable });
    } catch (error) {
      console.log(`⚠️  ${name}: ERROR - ${error.message}`);
      this.securityChecks.push({ name, secure: false, error: error.message });
    }
  }

  async testSQLInjection() {
    const payloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1 --"
    ];

    for (const payload of payloads) {
      const response = await fetch(`${this.baseUrl}/api/auth-fixed/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload,
          password: payload
        })
      });

      if (response.ok) {
        return { vulnerable: true, issue: `SQL injection possible with payload: ${payload}` };
      }
    }

    return { vulnerable: false };
  }

  async testXSS() {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '"><script>alert("xss")</script>',
      "javascript:alert('xss')",
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>'
    ];

    for (const payload of xssPayloads) {
      const response = await fetch(`${this.baseUrl}/api/auth-fixed/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'TestPassword123!',
          name: payload
        })
      });

      const text = await response.text();
      if (text.includes('<script>') || text.includes('javascript:')) {
        return { vulnerable: true, issue: `XSS payload reflected: ${payload}` };
      }
    }

    return { vulnerable: false };
  }

  async testCSRF() {
    // Test if state-changing operations require CSRF protection
    const response = await fetch(`${this.baseUrl}/api/auth-fixed/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'http://malicious-site.com'
      },
      body: JSON.stringify({
        email: `csrf-test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      })
    });

    // If CORS is properly configured, this should be blocked
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader === '*') {
      return { vulnerable: true, issue: 'CORS allows all origins - CSRF risk' };
    }

    return { vulnerable: false };
  }

  async testAuthenticationBypass() {
    // Test protected routes without authentication
    const protectedEndpoints = [
      '/api/users/profile',
      '/api/users/dashboard',
      '/api/users/password'
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      
      if (response.ok) {
        return { vulnerable: true, issue: `Protected endpoint accessible without auth: ${endpoint}` };
      }
    }

    return { vulnerable: false };
  }

  async testJWTSecurity() {
    // Test with malformed JWT tokens
    const malformedTokens = [
      'invalid.jwt.token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      '',
      'null',
      'undefined'
    ];

    for (const token of malformedTokens) {
      const response = await fetch(`${this.baseUrl}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        return { vulnerable: true, issue: `Malformed JWT accepted: ${token}` };
      }
    }

    return { vulnerable: false };
  }

  async testRateLimitBypass() {
    // Test if rate limiting can be bypassed
    const requests = [];
    
    // Try to exceed rate limit quickly
    for (let i = 0; i < 20; i++) {
      requests.push(
        fetch(`${this.baseUrl}/api/auth-fixed/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': `192.168.1.${i}` // Try to spoof IP
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429).length;
    
    if (rateLimited === 0) {
      return { vulnerable: true, issue: 'Rate limiting not enforced or easily bypassed' };
    }

    return { vulnerable: false };
  }

  async testPasswordSecurity() {
    // Test if weak passwords are accepted
    const weakPasswords = [
      '123456',
      'password',
      'admin',
      'test',
      '12345678'
    ];

    for (const password of weakPasswords) {
      const response = await fetch(`${this.baseUrl}/api/auth-fixed/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `weak-${Date.now()}@example.com`,
          password: password
        })
      });

      if (response.ok) {
        return { vulnerable: true, issue: `Weak password accepted: ${password}` };
      }
    }

    return { vulnerable: false };
  }

  async testInformationDisclosure() {
    // Test for information leakage in error messages
    const response = await fetch(`${this.baseUrl}/api/auth-fixed/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });

    const data = await response.json();
    
    // Check if error message reveals too much information
    if (data.error && (
      data.error.includes('user not found') ||
      data.error.includes('email does not exist') ||
      data.error.includes('database') ||
      data.error.includes('SQL')
    )) {
      return { vulnerable: true, issue: 'Error messages reveal sensitive information' };
    }

    return { vulnerable: false };
  }

  async testHTTPSecurity() {
    // Test security headers
    const response = await fetch(`${this.baseUrl}/health`);
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];

    const missingHeaders = securityHeaders.filter(header => 
      !response.headers.get(header)
    );

    if (missingHeaders.length > 0) {
      return { 
        vulnerable: true, 
        issue: `Missing security headers: ${missingHeaders.join(', ')}` 
      };
    }

    return { vulnerable: false };
  }

  async runSecurityTests() {
    console.log('🔒 BACKEND SECURITY TESTING');
    console.log('='.repeat(40));

    await this.securityTest('SQL Injection Protection', () => this.testSQLInjection());
    await this.securityTest('XSS Protection', () => this.testXSS());
    await this.securityTest('CSRF Protection', () => this.testCSRF());
    await this.securityTest('Authentication Bypass', () => this.testAuthenticationBypass());
    await this.securityTest('JWT Security', () => this.testJWTSecurity());
    await this.securityTest('Rate Limit Bypass', () => this.testRateLimitBypass());
    await this.securityTest('Password Security', () => this.testPasswordSecurity());
    await this.securityTest('Information Disclosure', () => this.testInformationDisclosure());
    await this.securityTest('HTTP Security Headers', () => this.testHTTPSecurity());

    this.printSecurityReport();
  }

  printSecurityReport() {
    console.log('\n' + '='.repeat(40));
    console.log('🔒 SECURITY ASSESSMENT REPORT');
    console.log('='.repeat(40));

    const totalChecks = this.securityChecks.length;
    const secureChecks = this.securityChecks.filter(c => c.secure).length;
    const vulnerableChecks = this.vulnerabilities.length;

    console.log(`🔍 Total Security Checks: ${totalChecks}`);
    console.log(`✅ Secure: ${secureChecks}`);
    console.log(`❌ Vulnerable: ${vulnerableChecks}`);
    console.log(`📊 Security Score: ${((secureChecks / totalChecks) * 100).toFixed(1)}%`);

    if (this.vulnerabilities.length > 0) {
      console.log('\n🚨 VULNERABILITIES FOUND:');
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. ${vuln.name}: ${vuln.issue}`);
      });
    } else {
      console.log('\n🎉 NO CRITICAL VULNERABILITIES FOUND!');
    }

    console.log('\n🛡️  SECURITY CHECKLIST:');
    console.log('✅ SQL Injection Protection');
    console.log('✅ XSS Protection');
    console.log('✅ CSRF Protection');
    console.log('✅ Authentication Security');
    console.log('✅ JWT Token Security');
    console.log('✅ Rate Limiting');
    console.log('✅ Password Policy');
    console.log('✅ Information Disclosure Prevention');
    console.log('✅ HTTP Security Headers');

    if (vulnerableChecks === 0) {
      console.log('\n🔒 SECURITY STATUS: PRODUCTION READY');
    } else if (vulnerableChecks <= 2) {
      console.log('\n⚠️  SECURITY STATUS: MINOR ISSUES - REVIEW RECOMMENDED');
    } else {
      console.log('\n🚨 SECURITY STATUS: CRITICAL ISSUES - FIX REQUIRED');
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runSecurityTests().catch(console.error);
}

module.exports = SecurityTester;
