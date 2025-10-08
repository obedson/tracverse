require('dotenv').config();

async function checkServer() {
  console.log('🔍 Checking server status...\n');
  
  try {
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is running!');
      console.log('📊 Server info:', data);
      return true;
    } else {
      console.log('❌ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('💡 Start the server with: npm start');
    console.log('🔧 Error:', error.message);
    return false;
  }
}

if (require.main === module) {
  checkServer();
}

module.exports = { checkServer };
