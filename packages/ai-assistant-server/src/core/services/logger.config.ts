import { LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '../../config';

interface AgentLogMetadata {
  agentId?: string;
  agentType?: string;
  sessionId?: string;
  conversationId?: string;
  threadId?: string;
  step?: number;
  metrics?: {
    tokensUsed?: number;
    latency?: number;
    retries?: number;
  };
}

// Extend FileTransportOptions to include our custom filter property
interface CustomFileTransportOptions
  extends winston.transports.FileTransportOptions {
  filter?: (info: winston.LogEntry) => boolean;
}

/**
 * Configuration for the application logger
 */
export class LoggerConfig {
  private static configService: ConfigService;
  private static readonly LOG_RETENTION_DAYS = 7;

  /**
   * Set the ConfigService instance for environment-aware configuration
   * @param configService The ConfigService instance
   */
  static setConfigService(configService: ConfigService) {
    this.configService = configService;
  }

  /**
   * Determine if the application is running in production mode
   * @returns True if in production mode, false otherwise
   */
  private static isProduction(): boolean {
    return (
      this.configService?.isProduction() ||
      process.env.NODE_ENV === 'production'
    );
  }

  /**
   * Clean up old log files
   * @param directory Directory containing log files
   */
  private static cleanupOldLogs(directory: string) {
    if (!fs.existsSync(directory)) return;

    try {
      const files = fs.readdirSync(directory);

      files.forEach((file) => {
        const filePath = path.join(directory, file);
        try {
          const stats = fs.statSync(filePath);

          // Skip directories
          if (stats.isDirectory()) {
            // Recursively clean up files in subdirectories
            this.cleanupOldLogs(filePath);
            return;
          }

          // Only process .log files
          if (!file.endsWith('.log')) {
            return;
          }

          // Check file age
          const now = new Date().getTime();
          const fileAge = now - stats.mtime.getTime();
          const daysOld = fileAge / (1000 * 60 * 60 * 24);

          if (daysOld >= this.LOG_RETENTION_DAYS) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error(`Failed to process ${filePath}:`, error);
        }
      });
    } catch (error) {
      console.error(`Failed to clean up logs in ${directory}:`, error);
    }
  }

  /**
   * Creates a logger instance with file and console transports
   * @param context The logger context
   * @returns A configured logger instance
   */
  static createLogger(context?: string): winston.Logger {
    // Create logs directory structure
    const logsDir = path.join(process.cwd(), 'logs');
    const agentLogsDir = path.join(logsDir, 'agents');
    const flowLogsDir = path.join(logsDir, 'flows');
    const metricsLogsDir = path.join(logsDir, 'metrics');

    [logsDir, agentLogsDir, flowLogsDir, metricsLogsDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Clean up old logs
    this.cleanupOldLogs(logsDir);
    this.cleanupOldLogs(agentLogsDir);
    this.cleanupOldLogs(flowLogsDir);
    this.cleanupOldLogs(metricsLogsDir);

    // Define log file paths
    const errorLogPath = path.join(logsDir, 'error.log');
    const combinedLogPath = path.join(logsDir, 'combined.log');
    const agentLogPath = path.join(agentLogsDir, 'agent.log');
    const flowLogPath = path.join(flowLogsDir, 'flow.log');
    const metricsLogPath = path.join(metricsLogsDir, 'metrics.log');

    // Determine log level based on environment
    const logLevel = this.isProduction() ? 'info' : 'debug';

    // Create JSON format for file logs with metadata handling
    const jsonFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        return JSON.stringify({
          timestamp,
          level,
          message,
          context: context || meta.context,
          ...('agentMetadata' in meta ? { agent: meta.agentMetadata } : {}),
          ...('flowMetadata' in meta ? { flow: meta.flowMetadata } : {}),
          ...('metrics' in meta ? { metrics: meta.metrics } : {}),
          ...meta,
        });
      }),
    );

    // Create console format with colors and pretty print
    const consoleFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      winston.format.colorize(),
      winston.format.printf(
        ({
          timestamp,
          level,
          message,
          context: ctx,
          agentMetadata,
          flowMetadata,
          metrics,
          ...meta
        }) => {
          let output = `[${timestamp}] ${level} [${ctx || context}] ${message}`;

          if (agentMetadata) {
            output += `\nAgent: ${JSON.stringify(agentMetadata)}`;
          }
          if (flowMetadata) {
            output += `\nFlow: ${JSON.stringify(flowMetadata)}`;
          }
          if (metrics) {
            output += `\nMetrics: ${JSON.stringify(metrics)}`;
          }
          if (Object.keys(meta).length) {
            output += `\nMeta: ${JSON.stringify(meta)}`;
          }

          return output;
        },
      ),
    );

    // Create Winston transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: consoleFormat,
        level: logLevel,
      }),

      // Error log file transport
      new winston.transports.File({
        filename: errorLogPath,
        level: 'error',
        format: jsonFormat,
      } as CustomFileTransportOptions),

      // Combined log file transport
      new winston.transports.File({
        filename: combinedLogPath,
        format: jsonFormat,
        level: logLevel,
      } as CustomFileTransportOptions),

      // Agent-specific log transport
      new winston.transports.File({
        filename: agentLogPath,
        format: jsonFormat,
        level: logLevel,
        filter: (info: winston.LogEntry) => !!info.agentMetadata,
      } as CustomFileTransportOptions),

      // Flow-specific log transport
      new winston.transports.File({
        filename: flowLogPath,
        format: jsonFormat,
        level: logLevel,
        filter: (info: winston.LogEntry) => !!info.flowMetadata,
      } as CustomFileTransportOptions),

      // Metrics-specific log transport
      new winston.transports.File({
        filename: metricsLogPath,
        format: jsonFormat,
        level: logLevel,
        filter: (info: winston.LogEntry) => !!info.metrics,
      } as CustomFileTransportOptions),
    ];

    // Create and return the logger
    const logger = winston.createLogger({
      defaultMeta: { context },
      transports,
      // Handle uncaught exceptions
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logsDir, 'exceptions.log'),
          format: jsonFormat,
        }),
      ],
    });

    // Add custom methods for agent logging
    return Object.assign(logger, {
      logAgent: (message: string, metadata: AgentLogMetadata) => {
        logger.info(message, { agentMetadata: metadata });
      },
      logFlow: (message: string, flowData: any) => {
        logger.info(message, { flowMetadata: flowData });
      },
      logMetrics: (message: string, metrics: any) => {
        logger.info(message, { metrics });
      },
    });
  }

  /**
   * Creates a NestJS-compatible logger instance
   * @param context The logger context
   * @returns A NestJS-compatible logger instance
   */
  static createNestLogger(context?: string): NestLoggerService {
    // Determine log levels based on environment
    const logLevels: LogLevel[] = this.isProduction()
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'];

    return WinstonModule.createLogger({
      instance: this.createLogger(context),
    });
  }
}
