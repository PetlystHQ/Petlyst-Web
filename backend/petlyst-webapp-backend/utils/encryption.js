const crypto = require('crypto');
require('dotenv').config();

// Get encryption key from environment variables or use a default for development
// In production, this should ALWAYS be set in environment variables
// Ensure the key is exactly 32 bytes (256 bits) for AES-256
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'REDACTED_ENCRYPTION_FALLBACK').slice(0, 32).padEnd(32, '0');
const IV_LENGTH = 16; // For AES, this is always 16 bytes

/**
 * Encrypts text using AES-256-CBC algorithm
 * @param {string} text - The text to encrypt (e.g., TC identity number)
 * @returns {string} - The encrypted text as a hex string with IV prepended
 */
function encrypt(text) {
  if (!text) return null;
  
  // Create a random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher with key and iv
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted data for later use in decryption
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts text using AES-256-CBC algorithm
 * @param {string} encryptedText - The encrypted text with IV prepended
 * @returns {string} - The decrypted text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  // Split IV and encrypted text
  const textParts = encryptedText.split(':');
  if (textParts.length !== 2) return null;
  
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedData = textParts[1];
  
  // Create decipher with key and iv
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  // Decrypt the text
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
}; 