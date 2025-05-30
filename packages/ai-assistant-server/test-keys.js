const fs = require('fs');
const crypto = require('crypto');

// Read the keys
const publicKeyPath = './public.pem';
const privateKeyPath = './private_unencrypted_pkcs8.pem';

const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

console.log('Public key loaded:', publicKey.substring(0, 50) + '...');
console.log('Private key loaded:', privateKey.substring(0, 50) + '...');

// Test data
const testData = 'This is a test message to encrypt and decrypt';
console.log('Original data:', testData);

// Encrypt with public key
const encryptedData = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  },
  Buffer.from(testData),
);

console.log('Encrypted data (base64):', encryptedData.toString('base64'));

// Try to decrypt with private key
try {
  const decryptedData = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedData,
  );

  console.log('Decrypted data:', decryptedData.toString('utf8'));
  console.log('Decryption successful!');
} catch (error) {
  console.error('Decryption failed:', error);
}

// Try alternative decryption methods
console.log('\nTrying alternative decryption methods:');

// Method 1: OAEP with SHA-1
try {
  const decryptedData = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1',
    },
    encryptedData,
  );

  console.log(
    'Method 1 (OAEP with SHA-1) successful:',
    decryptedData.toString('utf8'),
  );
} catch (error) {
  console.error('Method 1 (OAEP with SHA-1) failed:', error.message);
}

// Method 2: PKCS1 Padding
try {
  const decryptedData = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    encryptedData,
  );

  console.log(
    'Method 2 (PKCS1 Padding) successful:',
    decryptedData.toString('utf8'),
  );
} catch (error) {
  console.error('Method 2 (PKCS1 Padding) failed:', error.message);
}

// Method 3: No Padding
try {
  const decryptedData = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_NO_PADDING,
    },
    encryptedData,
  );

  console.log(
    'Method 3 (No Padding) successful:',
    decryptedData.toString('utf8'),
  );
} catch (error) {
  console.error('Method 3 (No Padding) failed:', error.message);
}

console.log('\nTest completed.');
