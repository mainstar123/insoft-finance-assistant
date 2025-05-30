const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Ask for the input file path
rl.question(
  'Enter the path to your encrypted private key file: ',
  (inputPath) => {
    // Ask for the passphrase
    rl.question('Enter the passphrase for your private key: ', (passphrase) => {
      // Ask for the output file path
      rl.question(
        'Enter the path for the output unencrypted key file: ',
        (outputPath) => {
          try {
            // Read the encrypted private key
            const encryptedKey = fs.readFileSync(inputPath, 'utf8');
            console.log(`Read encrypted key from ${inputPath}`);

            // Create a private key object
            const privateKey = crypto.createPrivateKey({
              key: encryptedKey,
              passphrase: passphrase,
              format: 'pem',
            });

            // Export the key in unencrypted PKCS#8 format
            const unencryptedKey = privateKey.export({
              type: 'pkcs8',
              format: 'pem',
            });

            // Write the unencrypted key to the output file
            fs.writeFileSync(outputPath, unencryptedKey);
            console.log(`Unencrypted PKCS#8 key written to ${outputPath}`);

            // Also export the public key for verification
            const publicKey = crypto.createPublicKey(privateKey);
            const publicKeyPem = publicKey.export({
              type: 'spki',
              format: 'pem',
            });

            // Write the public key to a file
            const publicKeyPath = outputPath.replace('.pem', '_public.pem');
            fs.writeFileSync(publicKeyPath, publicKeyPem);
            console.log(`Public key written to ${publicKeyPath}`);

            // Test the keys
            console.log('\nTesting the key pair...');
            const testData = 'Hello, WhatsApp Flow!';

            // Encrypt with public key
            const encrypted = crypto.publicEncrypt(
              {
                key: publicKeyPem,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
              },
              Buffer.from(testData),
            );

            // Decrypt with private key
            const decrypted = crypto.privateDecrypt(
              {
                key: unencryptedKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
              },
              encrypted,
            );

            console.log(
              'Test encryption/decryption result:',
              decrypted.toString() === testData ? 'SUCCESS' : 'FAILED',
            );

            console.log('\nNext steps:');
            console.log(
              '1. Update your environment variables to use the new unencrypted key',
            );
            console.log('2. Set WHATSAPP_PASSPHRASE to an empty string');
            console.log('3. Restart your server');
            console.log(
              '4. Use the refresh-key endpoint to force WhatsApp to fetch your public key again',
            );
          } catch (error) {
            console.error('Error converting key:', error.message);
            console.error(error.stack);
          } finally {
            rl.close();
          }
        },
      );
    });
  },
);
