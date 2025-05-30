const fs = require('fs');
const crypto = require('crypto');

// Read the private key
const privateKeyPath = './private_unencrypted_pkcs8.pem';
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

console.log('Private key loaded:', privateKey.substring(0, 50) + '...');

// WhatsApp Flow encrypted data from logs
const encrypted_aes_key =
  'hDGwDEamDRVJSY8y9uFbW/RENiX274g6bwWBP9cK3pc33soJ5AwM9PqCqhyqTMHwmvvXxbOg3bh6tHJ/PIgPOUaLLW/4FXWJv/b/ShBxD+va+za3/npsAPHfvefC7UNXIBi/Om1aNDqhNyTi29DENT+zHlPa/Ys7m9ppVJBw1pTNXioJ0R79zvecuris5qiNBZTOg0KfstI2JBBAwndKK14ydsCsdTwzS4kKbTFP2DwS8FKFqa6n0aCsQFq0jSRfVyFL0Q/8tpmYa0ijTvyIhsnTxv7TY3oddkojnGTSOWwgk6l8LRTF/0Yvi0qSDnGCg/Jy5wCoLWwLWc5rJqqUPQ==';
const encrypted_flow_data =
  'AFwQpco5L2hoJpxKy12sENcVC7JJ0Wu0urxDK5l4VNFTJ1bfHzYoryim3SELA6mjTo/KpvgcJVxWNY9Gs0XRVIlmrU0uOrDDsqgb+Jfkf7TQJm6DQfZm088MdeA5pwJCMN8jbDypwYEqcvyYUmtYZVL6LTL3w1oUCdGMUPR6uQ1J1w3FeicZioZod1fUziNu+mmb26wSo5XHfmW/LX01dDEaPInimMINh+mTqi6fDa8rxyGxMjI2OXTEuyCwCEz/FlqCcZLMwJjHR9o1/R3nJS7zq8dhl4IaqnklSlv2W3bHMvkOxQY739pONM3oww72eVrpLIg5UV+QkcAkfbGOEquzqfrEKnlg6osZFOCzzJXtq2/jJFSHdMAJUIJEEkM8zrSc2NBVMJLBU9q/l9gGAyHXuiv6lcV+/PcPPRL5tLaZdya9EVj9Va+LWb5jZyHVop6jiJFONFTdyxM53trWZyCI2R/GAagX1Z7jsMxYawPk+ds=';
const initial_vector = 'HYTMNtgrSFSwKFoYqBawaQ==';

console.log('Encrypted AES key length:', encrypted_aes_key.length);
console.log('Encrypted flow data length:', encrypted_flow_data.length);
console.log('Initial vector length:', initial_vector.length);

// Try multiple decryption approaches
console.log('\nTrying different decryption methods:');

// Approach 1: Standard OAEP with SHA-256
try {
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encrypted_aes_key, 'base64'),
  );

  console.log('Approach 1 (OAEP with SHA-256) successful!');
  console.log('Decrypted AES key length:', decryptedAesKey.length);
  console.log('Decrypted AES key (hex):', decryptedAesKey.toString('hex'));

  // Try to decrypt the flow data
  const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
  const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

  const TAG_LENGTH = 16;
  const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
  const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

  console.log('Flow data details:');
  console.log('- Flow data length:', flowDataBuffer.length);
  console.log('- Initial vector length:', initialVectorBuffer.length);
  console.log('- Data body length:', encrypted_flow_data_body.length);
  console.log('- Tag length:', encrypted_flow_data_tag.length);

  try {
    const decipher = crypto.createDecipheriv(
      'aes-128-gcm',
      decryptedAesKey,
      initialVectorBuffer,
    );
    decipher.setAuthTag(encrypted_flow_data_tag);

    const decryptedJSONString = Buffer.concat([
      decipher.update(encrypted_flow_data_body),
      decipher.final(),
    ]).toString('utf-8');

    console.log('Flow data decryption successful!');
    console.log('Decrypted JSON:', decryptedJSONString);
  } catch (error) {
    console.error('Flow data decryption failed:', error.message);
  }
} catch (error) {
  console.error('Approach 1 (OAEP with SHA-256) failed:', error.message);
}

// Approach 2: OAEP with SHA-1
try {
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1',
    },
    Buffer.from(encrypted_aes_key, 'base64'),
  );

  console.log('\nApproach 2 (OAEP with SHA-1) successful!');
  console.log('Decrypted AES key length:', decryptedAesKey.length);
  console.log('Decrypted AES key (hex):', decryptedAesKey.toString('hex'));
} catch (error) {
  console.error('\nApproach 2 (OAEP with SHA-1) failed:', error.message);
}

// Approach 3: PKCS1 Padding
try {
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(encrypted_aes_key, 'base64'),
  );

  console.log('\nApproach 3 (PKCS1 Padding) successful!');
  console.log('Decrypted AES key length:', decryptedAesKey.length);
  console.log('Decrypted AES key (hex):', decryptedAesKey.toString('hex'));
} catch (error) {
  console.error('\nApproach 3 (PKCS1 Padding) failed:', error.message);
}

// Approach 4: No Padding
try {
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_NO_PADDING,
    },
    Buffer.from(encrypted_aes_key, 'base64'),
  );

  console.log('\nApproach 4 (No Padding) successful!');
  console.log('Decrypted AES key length:', decryptedAesKey.length);
  console.log('Decrypted AES key (hex):', decryptedAesKey.toString('hex'));
} catch (error) {
  console.error('\nApproach 4 (No Padding) failed:', error.message);
}

console.log('\nTest completed.');
