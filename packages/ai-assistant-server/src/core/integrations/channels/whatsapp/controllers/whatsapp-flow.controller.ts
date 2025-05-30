import { Body, Controller, HttpStatus, HttpCode, Param, Post, Req, Res, Logger } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WhatsAppFlowEncryptionService } from '../services/whatsapp-flow-encryption.service';
import { RegisterUserFlowService } from '../flows/register-user/register-user.service';
import type { EncryptedFlowRequest } from '../whatsapp.types';
import {
  FlowRequestSignatureException,
  UnhandledFlowException,
} from '../flows/whatsapp-flow.errors';

export type FlowName = 'register-user-flow' | 'register-user-flow-en';

@Controller('whatsapp/flows')
export class WhatsAppFlowController {
  private readonly logger = new Logger(WhatsAppFlowController.name);

  constructor(
    private readonly encryptionService: WhatsAppFlowEncryptionService,
    private readonly registerUserFlow: RegisterUserFlowService,
  ) {}

  @Post('/:flow')
  async handleFlow(
    @Req() request: RawBodyRequest<Request>,
    @Body() body: EncryptedFlowRequest,
    @Res() response: Response,
    @Param('flow') flow: FlowName,
  ) {
    try {
    console.log("🚀 ~ WhatsAppFlowController ~ handleFlow ~ flow:", flow)
    const isValidSignature =
      this.encryptionService.isRequestSignatureValid(request);

    if (!isValidSignature) {
      throw new FlowRequestSignatureException();
    }

    const decryptedRequest = this.encryptionService.decryptRequest(body);
    const { aesKeyBuffer, initialVectorBuffer, decryptedBody } =
      decryptedRequest;

    let flowResponse = await this.handleFlowRequest(decryptedBody, flow);

    const encryptedResponse = this.encryptionService.encryptResponse(
      flowResponse,
      aesKeyBuffer,
      initialVectorBuffer,
    );

      response.status(200).send(encryptedResponse);
    } catch (error) {
      console.log("🚀 ~ WhatsAppFlowController ~ error:", error)
      this.logger.error('Error handling flow', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      response.status(500).send({
        error: 'InternalServerError',
      });
    }
  }

  private handleFlowRequest(decryptedBody: any, flow: FlowName) {
    switch (flow) {
      case 'register-user-flow':
        return this.registerUserFlow.handleFlowRequest(decryptedBody);
      case 'register-user-flow-en':
        return this.registerUserFlow.handleFlowRequest(decryptedBody);
      default:
        throw new UnhandledFlowException();
    }
  }


  /**
   * Force WhatsApp to re-fetch the public key
   * This endpoint returns a 421 status code, which tells WhatsApp to re-fetch the public key
   * Use this if you've updated your key pair and WhatsApp is still using the old public key
   */
  @Post('refresh-key')
  @HttpCode(421) // 421 status code (MISDIRECTED_REQUEST)
  forceKeyRefresh() {
    this.logger.log('Forcing WhatsApp to re-fetch the public key');
    return {
      message: 'Please re-fetch the public key',
      error: 'KeyRefreshRequired',
    };
  }
}
