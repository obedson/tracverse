require('dotenv').config();

class PerformanceTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = [];
  }

  async measureEndpoint(name, endpoint, options = {}) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      
      const result = {
        name,
        endpoint,
        responseTime: endTime - startTime,
        status: response.status,
        memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
        success: response.ok
      };
      
      this.results.push(result);
      console.log(`📊 ${name}: ${result.responseTime}ms (${result.status})`);
      
      return result;
    } catch (error) {
      const result = {
        name,
        endpoint,
        responseTime: Date.now() - startTime,
        status: 'ERROR',
        error: error.message,
        success: false
      };
      
      this.results.push(result);
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      return result;
    }
  }

  async loadTest(endpoint, concurrent = 10, requests = 50) {
    console.log(`\n🔥 Load Testing: ${concurrent} concurrent users, ${requests} requests`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < requests; i++) {
      const promise = fetch(`${this.baseUrl}${endpoint}`)
        .then(response => ({
          status: response.status,
          time: Date.now(),
          success: response.ok
        }))
        .catch(error => ({
          status: 'ERROR',
          time: Date.now(),
          error: error.message,
          success: false
        }));
      
      promises.push(promise);
      
      // Stagger requests to simulate concurrent users
      if (i % concurrent === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const totalTime = endTime - startTime;
    const requestsPerSecond = (requests / (totalTime / 1000)).toFixed(2);
    
    console.log(`✅ Successful: ${successful}/${requests}`);
    console.log(`❌ Failed: ${failed}/${requests}`);
    console.log(`⚡ Requests/sec: ${requestsPerSecond}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    
    return {
      successful,
      failed,
      totalTime,
      requestsPerSecond: parseFloat(requestsPerSecond)
    };
  }

  async runPerformanceTests() {
    console.log('⚡ BACKEND PERFORMANCE TESTING');
    console.log('='.repeat(40));

    // 1. Response Time Tests
    console.log('\n📊 Response Time Tests:');
    await this.measureEndpoint('Health Check', '/health');
    await this.measureEndpoint('System Settings', '/api/settings');
    await this.measureEndpoint('Settings Health', '/api/settings/health');
    
    // Create test user for authenticated endpoints
    const testEmail = `perf-test-${Date.now()}@example.com`;
    let authToken = null;
    
    const authResult = await this.measureEndpoint('User Registration', '/api/auth-fixed/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!'
      })
    });
    
    if (authResult.success) {
      const response = await fetch(`${this.baseUrl}/api/auth-fixed/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'TestPassword123!'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        authToken = data.token;
      }
    }
    
    if (authToken) {
      await this.measureEndpoint('User Profile', '/api/users/profile', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      await this.measureEndpoint('User Dashboard', '/api/users/dashboard', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    }

    // 2. Load Tests
    console.log('\n🔥 Load Testing:');
    const healthLoad = await this.loadTest('/health', 5, 25);
    const settingsLoad = await this.loadTest('/api/settings', 3, 15);
    
    // 3. Memory Usage Test
    console.log('\n💾 Memory Usage Test:');
    const initialMemory = process.memoryUsage();
    
    // Make multiple requests to check for memory leaks
    for (let i = 0; i < 20; i++) {
      await fetch(`${this.baseUrl}/health`);
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    console.log(`📈 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    
    // 4. Error Rate Test
    console.log('\n🚨 Error Handling Performance:');
    await this.measureEndpoint('404 Error', '/api/nonexistent');
    await this.measureEndpoint('Invalid Auth', '/api/users/profile', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });

    this.printPerformanceReport(healthLoad, settingsLoad);
  }

  printPerformanceReport(healthLoad, settingsLoad) {
    console.log('\n' + '='.repeat(40));
    console.log('📊 PERFORMANCE REPORT');
    console.log('='.repeat(40));
    
    // Response Time Analysis
    const responseTimes = this.results
      .filter(r => r.success && r.responseTime)
      .map(r => r.responseTime);
    
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`🚀 Fastest Response: ${minResponseTime}ms`);
      console.log(`🐌 Slowest Response: ${maxResponseTime}ms`);
    }
    
    // Load Test Results
    console.log(`\n🔥 Load Test Results:`);
    console.log(`📊 Health Endpoint: ${healthLoad.requestsPerSecond} req/sec`);
    console.log(`📊 Settings Endpoint: ${settingsLoad.requestsPerSecond} req/sec`);
    
    // Performance Benchmarks
    console.log(`\n📈 Performance Benchmarks:`);
    const avgTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    
    if (avgTime < 100) {
      console.log('✅ Excellent performance (<100ms average)');
    } else if (avgTime < 300) {
      console.log('✅ Good performance (<300ms average)');
    } else if (avgTime < 1000) {
      console.log('⚠️  Acceptable performance (<1s average)');
    } else {
      console.log('❌ Poor performance (>1s average)');
    }
    
    if (healthLoad.requestsPerSecond > 50) {
      console.log('✅ High throughput (>50 req/sec)');
    } else if (healthLoad.requestsPerSecond > 20) {
      console.log('✅ Good throughput (>20 req/sec)');
    } else {
      console.log('⚠️  Low throughput (<20 req/sec)');
    }
    
    console.log('\n🎯 PERFORMANCE SUMMARY:');
    console.log('✅ Response time measurements');
    console.log('✅ Load testing completed');
    console.log('✅ Memory usage monitored');
    console.log('✅ Error handling tested');
    console.log('✅ Throughput benchmarked');
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runPerformanceTests().catch(console.error);
}

module.exports = PerformanceTester;
