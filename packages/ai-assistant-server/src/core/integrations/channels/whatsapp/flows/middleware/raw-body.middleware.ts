import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';

/**
 * Middleware to ensure the raw body is preserved for signature validation
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RawBodyMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Skip if already processed
    if (req.hasOwnProperty('rawBody')) {
      this.logger.debug('Request already has rawBody, skipping middleware');
      next();
      return;
    }

    // Create a buffer to store the raw body
    let rawBody = Buffer.from('');

    // Listen for data chunks
    req.on('data', (chunk) => {
      rawBody = Buffer.concat([rawBody, chunk]);
    });

    // When the request is complete, store the raw body
    req.on('end', () => {
      (req as any).rawBody = rawBody;
      this.logger.debug('Raw body captured', {
        length: rawBody.length,
        contentType: req.headers['content-type'],
      });

      // If the content type is JSON, also parse the body
      if (req.headers['content-type']?.includes('application/json')) {
        try {
          req.body = JSON.parse(rawBody.toString('utf-8'));
        } catch (error) {
          this.logger.error('Failed to parse JSON body', { error });
        }
      }

      next();
    });
  }
}
