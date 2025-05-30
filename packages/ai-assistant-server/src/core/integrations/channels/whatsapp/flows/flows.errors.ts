import { HttpException } from '@nestjs/common';

/**
 * If you change your public key. You need to return HTTP status code 421 to refresh the public key on the client
 */
export class FlowEndpointException extends HttpException {
  constructor(
    statusCode = 421,
    message = 'Failed to decrypt. Please verify your private key',
  ) {
    super(message, statusCode);
  }
}

export class FlowRequestSignatureException extends HttpException {
  constructor() {
    super('Request Signature did not match', 432);
  }
}

/**
 * Unhandled endpoint request. Make sure you handle the request action.
 */
export class UnhandledFlowException extends HttpException {
  constructor() {
    super(
      'Unhandled endpoint request. Make sure you handle the request action & screen logged above.',
      433,
    );
  }
}
