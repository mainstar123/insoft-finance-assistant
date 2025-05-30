/**
 * WhatsApp Flow Key Generator
 *
 * This script generates a public and private key pair for WhatsApp Flow integration
 * following Meta's official format (PKCS1 for private key, SPKI for public key).
 *
 * Usage: node generate-whatsapp-keys.js [passphrase]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Get passphrase from command line argument
const passphrase = process.argv[2];
if (!passphrase) {
  console.error('Error: Passphrase is required');
  console.error('Usage: node generate-whatsapp-keys.js [passphrase]');
  process.exit(1);
}

try {
  console.log('Generating RSA key pair for WhatsApp Flow...');

  // Generate key pair using Meta's recommended format
  const keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1', // IMPORTANT: Use PKCS1 format as specified by Meta
      format: 'pem',
      cipher: 'des-ede3-cbc',
      passphrase,
    },
  });

  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, 'whatsapp-keys');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Write keys to files
  const privateKeyPath = path.join(outputDir, 'whatsapp_private.pem');
  const publicKeyPath = path.join(outputDir, 'whatsapp_public.pem');

  fs.writeFileSync(privateKeyPath, keyPair.privateKey);
  fs.writeFileSync(publicKeyPath, keyPair.publicKey);

  console.log('\nKeys generated successfully!');
  console.log(`Private key saved to: ${privateKeyPath}`);
  console.log(`Public key saved to: ${publicKeyPath}`);

  console.log(
    '\n************* COPY PASSPHRASE & PRIVATE KEY BELOW TO .env FILE *************',
  );
  console.log(`WHATSAPP_PASSPHRASE="${passphrase}"`);
  console.log(
    `\nWHATSAPP_PRIVATE_KEY="${keyPair.privateKey.replace(/\n/g, '\\n')}"`,
  );
  console.log(
    '************* COPY PASSPHRASE & PRIVATE KEY ABOVE TO .env FILE *************',
  );

  console.log('\n************* COPY PUBLIC KEY BELOW *************');
  console.log(keyPair.publicKey);
  console.log('************* COPY PUBLIC KEY ABOVE *************');

  console.log('\nNext steps:');
  console.log(
    '1. Update your environment variables with the private key and passphrase',
  );
  console.log('2. Upload the public key to WhatsApp Business Platform');
  console.log('3. Restart your server');
  console.log(
    '4. Use the refresh-key endpoint if needed to force WhatsApp to fetch your public key again',
  );
} catch (error) {
  console.error('Error generating keys:', error.message);
  console.error(error.stack);
  process.exit(1);
}
