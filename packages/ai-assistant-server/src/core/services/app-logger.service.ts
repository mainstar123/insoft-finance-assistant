import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { LoggerConfig } from './logger.config';
import * as winston from 'winston';

/**
 * Application logger service that provides consistent logging across the application
 * with support for structured metadata and context-aware logging.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  /**
   * Creates a new instance of the AppLoggerService
   * @param context Optional context for the logger
   */
  constructor(context?: string) {
    this.context = context;
    this.logger = LoggerConfig.createLogger(context);
  }

  /**
   * Sets the context for the logger
   * @param context The context to set
   */
  setContext(context: string): void {
    this.context = context;
    this.logger = LoggerConfig.createLogger(context);
  }

  /**
   * Logs a message at the 'log' level
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  log(message: any, context?: string, metadata?: Record<string, any>): void {
    this.logWithLevel('info', message, context, metadata);
  }

  /**
   * Logs a message at the 'error' level
   * @param message The message to log
   * @param trace Optional stack trace
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  error(
    message: any,
    trace?: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    const enhancedMetadata = { ...metadata };
    if (trace) {
      enhancedMetadata.trace = trace;
    }
    this.logWithLevel('error', message, context, enhancedMetadata);
  }

  /**
   * Logs a message at the 'warn' level
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  warn(message: any, context?: string, metadata?: Record<string, any>): void {
    this.logWithLevel('warn', message, context, metadata);
  }

  /**
   * Logs a message at the 'debug' level
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  debug(message: any, context?: string, metadata?: Record<string, any>): void {
    this.logWithLevel('debug', message, context, metadata);
  }

  /**
   * Logs a message at the 'verbose' level
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  verbose(message: any, context?: string, metadata?: Record<string, any>): void {
    this.logWithLevel('verbose', message, context, metadata);
  }

  /**
   * Logs a message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param context Optional context override
   * @param metadata Optional metadata to include in the log
   */
  private logWithLevel(
    level: string,
    message: any,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    const contextToUse = context || this.context;

    if (typeof message === 'object') {
      this.logger.log({
        level,
        message: JSON.stringify(message),
        context: contextToUse,
        ...metadata,
      });
    } else {
      this.logger.log({
        level,
        message,
        context: contextToUse,
        ...metadata,
      });
    }
  }
}
