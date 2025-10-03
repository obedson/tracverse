// utils/urlBuilder.js
const { generateTrackingId } = require('./idGenerator');

/**
 * Build a URL with UTM parameters
 * @param {string} originalUrl - The original URL to modify
 * @param {Object} utmConfig - UTM configuration object
 * @param {string} utmConfig.utm_source - UTM source parameter
 * @param {string} utmConfig.utm_medium - UTM medium parameter
 * @param {string} utmConfig.utm_campaign_prefix - Campaign prefix (tracking ID will be appended)
 * @returns {Object} Object containing modified_url and tracking_id
 */
function buildTrackingUrl(originalUrl, utmConfig) {
  try {
    // Generate tracking ID
    const trackingId = generateTrackingId();
    
    // Parse the original URL
    const url = new URL(originalUrl);
    
    // Add UTM parameters
    url.searchParams.set('utm_source', utmConfig.utm_source);
    url.searchParams.set('utm_medium', utmConfig.utm_medium);
    url.searchParams.set('utm_campaign', `${utmConfig.utm_campaign_prefix}${trackingId}`);
    
    return {
      modified_url: url.toString(),
      tracking_id: trackingId
    };
  } catch (error) {
    throw new Error(`Invalid URL format: ${error.message}`);
  }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UTM config object
 * @param {Object} config - UTM configuration to validate
 * @returns {Object} Validation result with isValid and error properties
 */
function validateUtmConfig(config) {
  if (!config) {
    return { isValid: false, error: 'UTM config is required' };
  }
  
  if (!config.utm_source || typeof config.utm_source !== 'string') {
    return { isValid: false, error: 'utm_source is required and must be a string' };
  }
  
  if (!config.utm_medium || typeof config.utm_medium !== 'string') {
    return { isValid: false, error: 'utm_medium is required and must be a string' };
  }
  
  if (!config.utm_campaign_prefix || typeof config.utm_campaign_prefix !== 'string') {
    return { isValid: false, error: 'utm_campaign_prefix is required and must be a string' };
  }
  
  return { isValid: true };
}

module.exports = {
  buildTrackingUrl,
  isValidUrl,
  validateUtmConfig
};
