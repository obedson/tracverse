// utils/idGenerator.js
const crypto = require('crypto');

/**
 * Base62 character set for encoding
 */
const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Convert a UUID to a Base62 encoded short string
 * @param {string} uuid - UUID string (with or without hyphens)
 * @returns {string} Base62 encoded string
 */
function uuidToBase62(uuid) {
  // Remove hyphens from UUID
  const hex = uuid.replace(/-/g, '');
  
  // Convert hex to BigInt
  let num = BigInt('0x' + hex);
  
  if (num === 0n) return '0';
  
  let result = '';
  const base = BigInt(62);
  
  while (num > 0n) {
    const remainder = Number(num % base);
    result = BASE62_CHARS[remainder] + result;
    num = num / base;
  }
  
  return result;
}

/**
 * Generate a unique tracking ID
 * @returns {string} Short Base62 tracking ID
 */
function generateTrackingId() {
  // Generate UUIDv4
  const uuid = crypto.randomUUID();
  
  // Convert to Base62
  const shortId = uuidToBase62(uuid);
  
  return shortId;
}

/**
 * Generate a pseudonymized user ID using SHA-256
 * @param {string} userId - Original user ID
 * @returns {string} Hashed user ID
 */
function pseudonymizeUserId(userId) {
  return crypto
    .createHash('sha256')
    .update(userId)
    .digest('hex');
}

module.exports = {
  generateTrackingId,
  uuidToBase62,
  pseudonymizeUserId
};
/**
 * Generate a unique referral code
 * @returns {string} 8-character alphanumeric referral code
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
module.exports = {
  generateTrackingId,
  uuidToBase62,
  pseudonymizeUserId,
  generateReferralCode
};
