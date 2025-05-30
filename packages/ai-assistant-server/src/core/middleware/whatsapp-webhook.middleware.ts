import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../../config';
import * as express from 'express';
import { IncomingMessage, ServerResponse } from 'http';

@Injectable()
export class WhatsAppWebhookMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WhatsAppWebhookMiddleware.name);
  private readonly jsonParser: express.RequestHandler;

  constructor(private readonly configService: ConfigService) {
    this.jsonParser = express.json({
      verify: (req: IncomingMessage, res: ServerResponse, buf: Buffer) => {
        // Store the raw body for signature verification
        (req as any).rawBody = buf;
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Parse the raw body and store it for signature verification
    this.jsonParser(req, res, (err: any) => {
      if (err) {
        this.logger.error('Failed to parse request body:', err);
        return res.status(400).json({ error: 'Invalid request body' });
      }
      next();
    });
  }
}
