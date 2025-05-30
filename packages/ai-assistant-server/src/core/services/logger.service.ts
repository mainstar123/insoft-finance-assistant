import { Injectable, Scope } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';

/**
 * Enhanced logger service that supports both console and file logging
 * with structured metadata and context-aware logging.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends AppLoggerService {
  private static instances: Map<string, LoggerService> = new Map();

  /**
   * Creates a new logger instance or returns an existing one for the given context
   * @param context The logger context
   */
  constructor(context?: string) {
    super(context || 'Application');

    // Store instance for reuse
    if (context && !LoggerService.instances.has(context)) {
      LoggerService.instances.set(context, this);
    }
  }

  /**
   * Gets a logger instance for the given context
   * @param context The logger context
   * @returns A logger instance
   */
  static getLogger(context?: string): LoggerService {
    if (context && LoggerService.instances.has(context)) {
      return LoggerService.instances.get(context) as LoggerService;
    }
    return new LoggerService(context);
  }

  /**
   * Logs a message at the 'log' level with optional metadata
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  customLog(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(message, context, metadata);
  }

  /**
   * Logs a message at the 'error' level with optional metadata
   * @param message The message to log
   * @param trace Optional stack trace
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  customError(
    message: string,
    trace?: string,
    context?: string,
    metadata?: Record<string, any>,
  ) {
    this.error(message, trace, context, metadata);
  }

  /**
   * Logs a message at the 'warn' level with optional metadata
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  customWarn(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ) {
    this.warn(message, context, metadata);
  }

  /**
   * Logs a message at the 'debug' level with optional metadata
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  customDebug(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ) {
    this.debug(message, context, metadata);
  }

  /**
   * Logs a message at the 'verbose' level with optional metadata
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  customVerbose(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ) {
    this.verbose(message, context, metadata);
  }
}
