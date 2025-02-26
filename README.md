# Petlyst-Web
Web Development Repository of Petlyst


# Encryption Utilities

This directory contains utilities for encrypting and decrypting sensitive data in the Petlyst application.

## AES-256 Encryption

The `encryption.js` file provides functions for encrypting and decrypting sensitive data using the AES-256-CBC algorithm.

### Features

- Uses AES-256-CBC encryption (industry standard)
- Generates a random initialization vector (IV) for each encryption
- Stores the IV with the encrypted data for decryption
- Handles null/undefined values gracefully

### Usage

```javascript
const { encrypt, decrypt } = require('./encryption');

// Encrypting data
const sensitiveData = '12345678901'; // TC identity number
const encryptedData = encrypt(sensitiveData);
// Result: a hex string with IV prepended, e.g., "a1b2c3d4e5f6g7h8i9j0:encrypted_data_in_hex"

// Decrypting data
const decryptedData = decrypt(encryptedData);
// Result: "12345678901"
```

### Security Considerations

1. The encryption key is stored in the `.env` file and should be kept secure
2. The key must be 32 characters long for AES-256
3. In production, always use environment variables for the encryption key
4. Never commit the actual `.env` file to version control (use `.env.example` instead)
5. Rotate encryption keys periodically for enhanced security

### Implementation Details

- TC identity numbers are encrypted before storage in the database
- They are decrypted only when needed for admin verification
- The database column type has been updated to TEXT to accommodate the longer encrypted strings

## Automatic Encryption

The system includes several mechanisms to ensure all TC identity numbers are encrypted:

1. **On Server Startup**: The server checks for unencrypted TC numbers and encrypts them automatically
2. **During Submission**: When veterinarians submit their verification details, TC numbers are encrypted before storage
3. **Admin Endpoints**: Administrators can check encryption status and re-encrypt any unencrypted TC numbers

### Admin Endpoints for Encryption Management

- `GET /api/admin/check-tc-encryption`: Check if all TC numbers are encrypted
- `POST /api/admin/encrypt-tc-numbers`: Re-encrypt any unencrypted TC numbers

### Encryption Script

A standalone script is also available to encrypt all existing TC numbers:

```bash
node scripts/encrypt_existing_tc_numbers.js
```

## Database Migration

A migration script is provided to update the database schema to support encrypted data:

```bash
node scripts/run_migration.js
```

This will alter the `veterinarian_tc_number` column in the `veterinarians` table to use the TEXT type, which can store the longer encrypted strings. 