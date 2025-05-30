import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../core/services/metrics.service';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Middleware for tracking HTTP requests for metrics
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('MetricsMiddleware');
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip metrics endpoint to avoid circular metrics
    if (req.path.startsWith('/metrics')) {
      return next();
    }

    // Record request start time
    const startTime = process.hrtime();

    // Record request start
    try {
      this.metricsService.recordHttpRequestStart(req.method, req.path);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording request start: ${errorMessage}`,
        errorStack,
      );
    }

    // Add response listener to record metrics when the request completes
    res.on('finish', () => {
      try {
        // Calculate request duration
        const hrTime = process.hrtime(startTime);
        const durationInSeconds = hrTime[0] + hrTime[1] / 1e9;

        // Record request end
        this.metricsService.recordHttpRequestEnd(
          req.method,
          req.path,
          res.statusCode,
          durationInSeconds,
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.customError(
          `Error recording request end: ${errorMessage}`,
          errorStack,
        );
      }
    });

    next();
  }
}
