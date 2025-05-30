const fs = require('fs');
const crypto = require('crypto');

// Read the private key
const privateKeyPath = process.argv[2] || './private_unencrypted_pkcs8.pem';
const passphrase = process.argv[3] || '';

try {
  const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
  console.log(
    'Private key loaded:',
    privateKeyContent.substring(0, 50) + '...',
  );

  // Create private key object
  const privateKey = crypto.createPrivateKey({
    key: privateKeyContent,
    passphrase: passphrase,
  });

  console.log('Private key details:');
  console.log('- Type:', privateKey.type);
  console.log('- Asymmetric key type:', privateKey.asymmetricKeyType);

  // WhatsApp Flow encrypted data from logs
  const encrypted_aes_key =
    'hDGwDEamDRVJSY8y9uFbW/RENiX274g6bwWBP9cK3pc33soJ5AwM9PqCqhyqTMHwmvvXxbOg3bh6tHJ/PIgPOUaLLW/4FXWJv/b/ShBxD+va+za3/npsAPHfvefC7UNXIBi/Om1aNDqhNyTi29DENT+zHlPa/Ys7m9ppVJBw1pTNXioJ0R79zvecuris5qiNBZTOg0KfstI2JBBAwndKK14ydsCsdTwzS4kKbTFP2DwS8FKFqa6n0aCsQFq0jSRfVyFL0Q/8tpmYa0ijTvyIhsnTxv7TY3oddkojnGTSOWwgk6l8LRTF/0Yvi0qSDnGCg/Jy5wCoLWwLWc5rJqqUPQ==';
  const encrypted_flow_data =
    'AFwQpco5L2hoJpxKy12sENcVC7JJ0Wu0urxDK5l4VNFTJ1bfHzYoryim3SELA6mjTo/KpvgcJVxWNY9Gs0XRVIlmrU0uOrDDsqgb+Jfkf7TQJm6DQfZm088MdeA5pwJCMN8jbDypwYEqcvyYUmtYZVL6LTL3w1oUCdGMUPR6uQ1J1w3FeicZioZod1fUziNu+mmb26wSo5XHfmW/LX01dDEaPInimMINh+mTqi6fDa8rxyGxMjI2OXTEuyCwCEz/FlqCcZLMwJjHR9o1/R3nJS7zq8dhl4IaqnklSlv2W3bHMvkOxQY739pONM3oww72eVrpLIg5UV+QkcAkfbGOEquzqfrEKnlg6osZFOCzzJXtq2/jJFSHdMAJUIJEEkM8zrSc2NBVMJLBU9q/l9gGAyHXuiv6lcV+/PcPPRL5tLaZdya9EVj9Va+LWb5jZyHVop6jiJFONFTdyxM53trWZyCI2R/GAagX1Z7jsMxYawPk+ds=';
  const initial_vector = 'HYTMNtgrSFSwKFoYqBawaQ==';

  console.log('\nEncrypted data details:');
  console.log('- Encrypted AES key length:', encrypted_aes_key.length);
  console.log('- Encrypted flow data length:', encrypted_flow_data.length);
  console.log('- Initial vector length:', initial_vector.length);

  // NEW APPROACH: Try decrypting with No Padding and extract the AES key
  console.log('\nTrying new approach: No Padding with key extraction');
  try {
    const encryptedKeyBuffer = Buffer.from(encrypted_aes_key, 'base64');
    console.log('- Encrypted key buffer length:', encryptedKeyBuffer.length);

    const rawDecrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_NO_PADDING,
      },
      encryptedKeyBuffer,
    );

    console.log('- Raw decrypted length:', rawDecrypted.length);
    console.log(
      '- Raw decrypted (hex):',
      rawDecrypted.toString('hex').substring(0, 64) + '...',
    );

    // Extract different potential AES keys from the raw decrypted data
    const potentialKeys = [
      { name: 'First 16 bytes', key: rawDecrypted.slice(0, 16) },
      { name: 'Last 16 bytes', key: rawDecrypted.slice(-16) },
      {
        name: 'Middle 16 bytes',
        key: rawDecrypted.slice(
          rawDecrypted.length / 2 - 8,
          rawDecrypted.length / 2 + 8,
        ),
      },
      { name: 'Bytes 1-16', key: rawDecrypted.slice(1, 17) },
    ];

    // Try to decrypt the flow data with each potential key
    const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
    const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

    const TAG_LENGTH = 16;
    const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
    const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

    console.log('\nFlow data details:');
    console.log('- Flow data length:', flowDataBuffer.length);
    console.log('- Initial vector length:', initialVectorBuffer.length);
    console.log('- Data body length:', encrypted_flow_data_body.length);
    console.log('- Tag length:', encrypted_flow_data_tag.length);

    console.log('\nTrying different key extractions:');
    for (const { name, key } of potentialKeys) {
      console.log(`\nTrying ${name}:`);
      console.log('- Key (hex):', key.toString('hex'));

      try {
        const decipher = crypto.createDecipheriv(
          'aes-128-gcm',
          key,
          initialVectorBuffer,
        );
        decipher.setAuthTag(encrypted_flow_data_tag);

        const decryptedData = Buffer.concat([
          decipher.update(encrypted_flow_data_body),
          decipher.final(),
        ]);

        console.log('- Decryption SUCCESSFUL!');
        console.log('- Decrypted data length:', decryptedData.length);

        // Try to parse as JSON
        try {
          const jsonString = decryptedData.toString('utf-8');
          console.log(
            '- Decrypted as string:',
            jsonString.substring(0, 100) +
              (jsonString.length > 100 ? '...' : ''),
          );

          const json = JSON.parse(jsonString);
          console.log(
            '- Parsed as JSON:',
            JSON.stringify(json, null, 2).substring(0, 200) + '...',
          );
          console.log('- THIS IS THE CORRECT KEY!');
        } catch (jsonError) {
          console.log('- Not valid JSON:', jsonError.message);
        }
      } catch (decryptError) {
        console.log('- Decryption failed:', decryptError.message);
      }
    }
  } catch (error) {
    console.error('New approach failed:', error.message);
  }

  console.log('\nTest completed.');
} catch (error) {
  console.error('Error:', error.message);
  console.error(
    'Usage: node test-whatsapp-flow-decryption.js [privateKeyPath] [passphrase]',
  );
}
