# WhatsApp Flow Integration Setup

This guide will help you set up WhatsApp Flow integration for your application, following Meta's official implementation guidelines.

## Key Generation

WhatsApp Flow requires a specific key format for encryption and decryption. Use the provided script to generate keys in the correct format:

```bash
node generate-whatsapp-keys.js YOUR_PASSPHRASE
```

This will generate:
- A private key in PKCS1 format (required by WhatsApp)
- A public key in SPKI format
- Environment variable settings to copy to your .env file

## Testing Your Keys

After generating the keys, you can test them to ensure they work correctly with Meta's decryption approach:

```bash
node test-meta-decryption.js
```

This script simulates the encryption and decryption process that WhatsApp Flow uses. If successful, it confirms that your keys are in the correct format.

## Implementation Steps

1. **Generate Keys**:
   ```bash
   node generate-whatsapp-keys.js YOUR_PASSPHRASE
   ```

2. **Update Environment Variables**:
   Copy the generated environment variables to your .env file:
   ```
   WHATSAPP_PASSPHRASE="your_passphrase"
   WHATSAPP_PRIVATE_KEY="your_private_key"
   WHATSAPP_APP_SECRET="your_app_secret"
   ```

3. **Upload Public Key to WhatsApp Business Platform**:
   - Go to your WhatsApp Business Platform dashboard
   - Navigate to the Flow settings
   - Upload the public key generated in the previous step

4. **Restart Your Server**:
   ```bash
   npm run start:dev
   ```

5. **Force Key Refresh (if needed)**:
   If you've updated your keys and WhatsApp is still using the old ones, use the refresh-key endpoint:
   ```
   POST /whatsapp/flows/refresh-key
   ```

## Troubleshooting

### Decryption Errors

If you encounter "oaep decoding error" or other decryption issues:

1. Verify your private key is in PKCS1 format (not PKCS8)
2. Ensure your passphrase is correct
3. Check that the public key uploaded to WhatsApp matches your private key
4. Use the refresh-key endpoint to force WhatsApp to fetch your public key again

### Signature Validation Errors

If you encounter signature validation errors:

1. Verify your WHATSAPP_APP_SECRET environment variable is correct
2. Ensure the raw body is preserved in your middleware
3. Check that the x-hub-signature-256 header is present in the request

## Key Format Requirements

WhatsApp Flow requires specific key formats:

- **Private Key**: PKCS1 format with des-ede3-cbc cipher
- **Public Key**: SPKI format

Using other formats (like PKCS8) will result in decryption errors.

## Reference Implementation

The implementation in this project follows Meta's official example:

```javascript
// Decryption
const decryptedAesKey = crypto.privateDecrypt(
  {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  },
  Buffer.from(encrypted_aes_key, 'base64')
);

// Encryption
const flipped_iv = [];
for (const pair of initialVectorBuffer.entries()) {
  flipped_iv.push(~pair[1]);
}

const cipher = crypto.createCipheriv(
  'aes-128-gcm',
  aesKeyBuffer,
  Buffer.from(flipped_iv)
);
```

## Additional Resources

- [WhatsApp Flow Documentation](https://developers.facebook.com/docs/whatsapp/flows)
- [WhatsApp Flow API Reference](https://developers.facebook.com/docs/whatsapp/flows/reference)
- [WhatsApp Flow Error Codes](https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes)
