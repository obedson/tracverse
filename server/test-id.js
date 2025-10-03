const { generateTrackingId, pseudonymizeUserId } = require('./utils/idGenerator');

console.log('Generated Tracking ID:', generateTrackingId());
console.log('Generated Tracking ID:', generateTrackingId());
console.log('Generated Tracking ID:', generateTrackingId());
console.log('');
console.log('Pseudonymized User:', pseudonymizeUserId('user123'));
console.log('Pseudonymized User:', pseudonymizeUserId('user456'));
