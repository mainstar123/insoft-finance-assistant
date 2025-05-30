import { Injectable, Logger, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';
import {
  DecryptedFlowRequest,
  EncryptedFlowRequest,
  FlowResponse,
} from '../whatsapp.types';

@Injectable()
export class WhatsAppFlowEncryptionService {
  private readonly logger = new Logger(WhatsAppFlowEncryptionService.name);
  private readonly privateKey: string;
  private readonly passphrase: string;
  private readonly appSecret: string;

  constructor(private readonly configService: ConfigService) {
    const privateKey = this.configService.get<string>('WHATSAPP_PRIVATE_KEY');
    const passphrase = this.configService.get<string>('WHATSAPP_PASSPHRASE');
    const appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET');

    if (!privateKey) throw new Error('WHATSAPP_PRIVATE_KEY is not configured');
    if (!passphrase) throw new Error('WHATSAPP_PASSPHRASE is not configured');
    if (!appSecret) throw new Error('WHATSAPP_APP_SECRET is not configured');

    this.privateKey = privateKey;
    this.passphrase = passphrase;
    this.appSecret = appSecret;
  }

  decryptRequest(request: EncryptedFlowRequest) {
    this.logger.debug('Decrypting flow request...');

    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = request;

    const privateKey = crypto.createPrivateKey({
      key: this.privateKey,
      passphrase: this.passphrase,
    });

    let decryptedAesKey: Buffer;
    try {
      decryptedAesKey = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(encrypted_aes_key, 'base64'),
      );
    } catch (error) {
      this.logger.error(`Failed to decrypt AES key: ${error}`);
      throw new Error('Failed to decrypt. Please verify your private key');
    }

    const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
    const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

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

    this.logger.debug('Request decrypted successfully');

    return {
      decryptedBody: JSON.parse(decryptedJSONString) as DecryptedFlowRequest,
      aesKeyBuffer: decryptedAesKey,
      initialVectorBuffer,
    };
  }

  encryptResponse(
    response: FlowResponse,
    aesKeyBuffer: Buffer,
    initialVectorBuffer: Buffer,
  ) {
    this.logger.debug('Encrypting flow response...');

    // flip initial vector as required by WhatsApp
    const flipped_iv: number[] = [];
    for (const pair of initialVectorBuffer.entries()) {
      flipped_iv.push(~pair[1]);
    }

    const cipher = crypto.createCipheriv(
      'aes-128-gcm',
      aesKeyBuffer,
      Buffer.from(flipped_iv),
    );

    return Buffer.concat([
      cipher.update(JSON.stringify(response), 'utf-8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString('base64');
  }

  isRequestSignatureValid(request: RawBodyRequest<Request>): boolean {
    try {
      const signatureHeader = request.get('x-hub-signature-256');

      if (!request.rawBody || !signatureHeader) {
        return false;
      }

      const signatureBuffer = Buffer.from(
        signatureHeader.replace('sha256=', ''),
        'utf-8',
      );

      const hmac = crypto.createHmac('sha256', this.appSecret);
      const digestString = hmac.update(request.rawBody).digest('hex');
      const digestBuffer = Buffer.from(digestString, 'utf-8');

      if (!crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
        this.logger.error('Request Signature did not match');
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to verify request signature: ${error}`);
      return false;
    }
  }
}
