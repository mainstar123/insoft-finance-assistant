import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  type RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';
import type { Request, Response } from 'express';

// Create a type alias to avoid the decorated signature issue
type RawRequest = RawBodyRequest<Request>;

@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsAppWebhookService: WhatsAppWebhookService,
  ) {
    this.logger.log('WhatsApp webhook controller initialized');
  }

  /**
   * Handle webhook verification
   * @param mode The mode
   * @param token The token
   * @param challenge The challenge
   * @returns The challenge if verification is successful
   */
  @Get()
  handleVerification(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string | number {
    this.logger.debug('Received webhook verification request', {
      mode,
      token,
      challenge,
    });

    const result = this.whatsAppWebhookService.verifyWebhook(mode, token);

    if (result === false) {
      this.logger.warn('Webhook verification failed');
      return 'Verification failed';
    }

    // Return the challenge to complete the verification
    return challenge;
  }

  /**
   * Handle webhook events
   * @param req The request
   * @param body The request body
   * @param signature The request signature
   * @returns A success message
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Body() body: any,
    @Res() response: Response,
  ): void {
    // Immediately acknowledge the webhook
    response.status(200).send('OK');

    // Process webhook asynchronously
    setImmediate(() => {
      try {
        this.whatsAppWebhookService.handleWebhookEvent(body);
      } catch (error) {
        this.logger.error(
          `Error handling webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    });
  }
}
