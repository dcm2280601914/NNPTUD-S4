const crypto = require('crypto');

/**
 * Generate random 16-character alphanumeric password
 */
function generateRandomPassword() {
  return crypto.randomBytes(8).toString('base64url').slice(0, 16).replace(/[^a-zA-Z0-9]/g, 'A');
}

module.exports = { generateRandomPassword };

