const { buildTrackingUrl, isValidUrl, validateUtmConfig } = require('./utils/urlBuilder');

// Test UTM config
const utmConfig = {
  utm_source: 'my_app',
  utm_medium: 'in_app_link',
  utm_campaign_prefix: 'yt_user_'
};

// Test URL
const originalUrl = 'https://youtube.com/watch?v=xyz';

console.log('Original URL:', originalUrl);
console.log('');

// Build tracking URL
const result = buildTrackingUrl(originalUrl, utmConfig);
console.log('Modified URL:', result.modified_url);
console.log('Tracking ID:', result.tracking_id);
console.log('');

// Test validation
console.log('Is valid URL?', isValidUrl(originalUrl));
console.log('Is valid config?', validateUtmConfig(utmConfig));
