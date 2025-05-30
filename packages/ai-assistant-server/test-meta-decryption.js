/**
 * WhatsApp Flow Decryption Test Script
 *
 * This script tests the decryption of WhatsApp Flow data using Meta's official approach.
 * It simulates the encryption and decryption process to verify that your keys work correctly.
 *
 * Usage: node test-meta-decryption.js [privateKeyPath] [passphrase]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Get private key path and passphrase from command line arguments
const privateKeyPath =
  process.argv[2] ||
  path.join(__dirname, 'whatsapp-keys', 'whatsapp_private.pem');
const passphrase = process.argv[3] || '';

try {
  console.log("Testing WhatsApp Flow decryption using Meta's approach...");

  // Read the private key
  const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
  console.log(`Private key loaded from: ${privateKeyPath}`);

  // Create private key object
  const privateKey = crypto.createPrivateKey({
    key: privateKeyContent,
    passphrase: passphrase,
  });

  // Generate a public key from the private key
  const publicKey = crypto.createPublicKey(privateKey);

  // Test data
  const testData = {
    screen: 'TEST_SCREEN',
    data: {
      name: 'Test User',
      email: 'test@example.com',
    },
    flow_token: 'test-flow-token',
    version: '3.0',
    action: 'data_exchange',
  };

  console.log('\nTest data:', JSON.stringify(testData, null, 2));

  // Step 1: Generate an AES key (simulating what WhatsApp would do)
  const aesKey = crypto.randomBytes(16); // 16 bytes for AES-128
  console.log('\nGenerated AES key (hex):', aesKey.toString('hex'));

  // Step 2: Encrypt the AES key with the public key (simulating what WhatsApp would do)
  const encryptedAesKey = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey,
  );

  console.log(
    'Encrypted AES key (base64):',
    encryptedAesKey.toString('base64'),
  );

  // Step 3: Generate an initial vector
  const initialVector = crypto.randomBytes(12); // 12 bytes for GCM mode
  console.log('Initial vector (base64):', initialVector.toString('base64'));

  // Step 4: Encrypt the test data with the AES key
  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, initialVector);
  const encryptedData = Buffer.concat([
    cipher.update(JSON.stringify(testData), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Combine encrypted data and auth tag
  const encryptedFlowData = Buffer.concat([encryptedData, authTag]);

  console.log(
    'Encrypted flow data (base64):',
    encryptedFlowData.toString('base64'),
  );

  // Create the encrypted request object
  const encryptedRequest = {
    encrypted_aes_key: encryptedAesKey.toString('base64'),
    encrypted_flow_data: encryptedFlowData.toString('base64'),
    initial_vector: initialVector.toString('base64'),
  };

  console.log(
    '\nEncrypted request:',
    JSON.stringify(encryptedRequest, null, 2),
  );

  // Now decrypt using Meta's approach
  console.log("\nDecrypting using Meta's approach...");

  try {
    // Step 1: Decrypt the AES key
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedRequest.encrypted_aes_key, 'base64'),
    );

    console.log('AES key decrypted successfully!');
    console.log('Decrypted AES key (hex):', decryptedAesKey.toString('hex'));

    // Verify the decrypted AES key matches the original
    if (decryptedAesKey.toString('hex') === aesKey.toString('hex')) {
      console.log('✅ Decrypted AES key matches the original!');
    } else {
      console.log('❌ Decrypted AES key does NOT match the original!');
    }

    // Step 2: Decrypt the flow data
    const flowDataBuffer = Buffer.from(
      encryptedRequest.encrypted_flow_data,
      'base64',
    );
    const initialVectorBuffer = Buffer.from(
      encryptedRequest.initial_vector,
      'base64',
    );

    const TAG_LENGTH = 16;
    const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
    const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

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

    console.log('\nFlow data decrypted successfully!');
    console.log('Decrypted JSON:', decryptedJSONString);

    const decryptedData = JSON.parse(decryptedJSONString);

    // Verify the decrypted data matches the original
    if (JSON.stringify(decryptedData) === JSON.stringify(testData)) {
      console.log('✅ Decrypted data matches the original!');
    } else {
      console.log('❌ Decrypted data does NOT match the original!');
    }

    console.log(
      "\n🎉 Test completed successfully! Your keys work correctly with Meta's decryption approach.",
    );
  } catch (error) {
    console.error('\n❌ Decryption failed:', error.message);
    console.error('Stack trace:', error.stack);
    console.error(
      "\nThis indicates that your keys may not be in the correct format or there's an issue with the decryption process.",
    );
    console.error(
      'Please regenerate your keys using the generate-whatsapp-keys.js script and try again.',
    );
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack trace:', error.stack);
  console.error(
    '\nUsage: node test-meta-decryption.js [privateKeyPath] [passphrase]',
  );
}
