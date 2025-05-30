import {
  ExceptionFilter,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ArgumentsHost as TypedArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '../../config';
import { LoggerService } from '../../core/services';

/**
 * Custom error response structure
 */
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
  correlationId?: string;
  errorId: string;
  details?: any;
}

/**
 * Global exception filter to handle all exceptions in a consistent way
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: TypedArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const errorId = this.generateErrorId();
    const correlationId = request.headers['x-correlation-id'] as string;

    // Extract error information
    const { statusCode, message, error } = this.extractErrorInfo(exception);

    // Log the exception with structured metadata
    this.logException(exception, {
      statusCode,
      path: request.url,
      method: request.method,
      errorId,
      correlationId,
      body: this.sanitizeRequestBody(request.body),
    });

    // Prepare and send error response
    const errorResponse = this.prepareErrorResponse(
      statusCode,
      message,
      error,
      request,
      errorId,
      correlationId,
      exception,
    );

    response.status(statusCode).json(errorResponse);
  }

  private logException(
    exception: unknown,
    metadata: Record<string, any>,
  ): void {
    const { statusCode } = metadata;

    // Determine log level based on status code
    if (statusCode >= 500) {
      this.loggerService.customError(
        `Server error: ${metadata.method} ${metadata.path}`,
        exception instanceof Error ? exception.stack : undefined,
        'GlobalExceptionFilter',
        metadata,
      );
    } else if (statusCode >= 400) {
      this.loggerService.customWarn(
        `Client error: ${metadata.method} ${metadata.path}`,
        'GlobalExceptionFilter',
        metadata,
      );
    } else {
      this.loggerService.customLog(
        `Exception: ${metadata.method} ${metadata.path}`,
        'GlobalExceptionFilter',
        metadata,
      );
    }
  }

  /**
   * Prepare a standardized error response
   */
  private prepareErrorResponse(
    statusCode: number,
    message: string,
    error: string,
    request: Request,
    errorId: string,
    correlationId: string,
    exception: unknown,
  ): ErrorResponse {
    const path = request.url;
    const timestamp = new Date().toISOString();

    // Create the error response
    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      path,
      timestamp,
      correlationId,
      errorId,
    };

    // Add details in development environment
    if (!this.configService.isProduction()) {
      errorResponse.details = {
        stack: exception instanceof Error ? exception.stack : undefined,
        cause:
          exception instanceof Error ? (exception as any).cause : undefined,
      };
    }

    return errorResponse;
  }

  /**
   * Extract error information from the exception
   */
  private extractErrorInfo(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    // Default values
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // Handle HttpException
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object') {
        const responseObj = response as Record<string, any>;
        message = responseObj.message || message;
        error = responseObj.error || exception.name;
      } else {
        message = response as string;
        error = exception.name;
      }
    }
    // Handle other types of errors
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }
    // Handle non-Error objects
    else if (exception !== null && typeof exception === 'object') {
      message = (exception as any).message || message;
      error = (exception as any).name || 'Unknown Error';
    }
    // Handle primitive values
    else if (exception !== null && exception !== undefined) {
      message = String(exception);
    }

    return { statusCode, message, error };
  }

  /**
   * Generate a unique error ID for tracking
   */
  private generateErrorId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'key',
    ];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request headers to remove sensitive information
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    if (!headers) return headers;

    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'api-key',
    ];

    for (const header of sensitiveHeaders) {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
