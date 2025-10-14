const crypto = require('crypto');

console.log('🔐 Generating secure JWT secrets...\n');

// Generate 256-bit (32 bytes) secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('Copy these to your .env file:');
console.log('=====================================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log('=====================================\n');

console.log('✅ Secrets generated successfully!');
console.log('⚠️  Keep these secrets secure and never share them');
console.log('💡 Each secret is 64 characters (256 bits) for maximum security');
