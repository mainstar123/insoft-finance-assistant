# Logging System

This directory contains the enhanced logging system for the AI Assistant Server. The logging system provides structured logging with different log levels based on the environment and supports context-aware logging.

## Components

### LoggerConfig

The `LoggerConfig` class provides configuration for the application logger. It creates Winston logger instances with file and console transports. The log level is determined based on the environment (production or development).

Key features:
- Environment-aware logging (different log levels for production and development)
- JSON-formatted logs for file transports
- Pretty-printed logs for console transport
- Support for uncaught exception handling

### AppLoggerService

The `AppLoggerService` is a transient-scoped service that implements the NestJS `LoggerService` interface. It provides consistent logging across the application with support for structured metadata and context-aware logging.

Key features:
- Support for different log levels (log, error, warn, debug, verbose)
- Context-aware logging
- Structured metadata support
- Proper error stack trace handling

### LoggerService

The `LoggerService` extends the `AppLoggerService` and provides additional features like instance caching for different contexts. It's the main service that should be used throughout the application for logging.

Key features:
- Instance caching for different contexts
- Custom logging methods with metadata support
- Singleton pattern for logger instances

## Usage

### Basic Usage

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../core/services';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {
    // Set the context for the logger
    this.logger.setContext('MyService');
  }

  doSomething() {
    // Log a message
    this.logger.customLog('Doing something');

    try {
      // Do something
    } catch (error) {
      // Log an error with stack trace and metadata
      this.logger.customError(
        'Failed to do something',
        error.stack,
        undefined,
        { additionalInfo: 'Some additional info' }
      );
    }
  }
}
```

### Logging with Metadata

```typescript
// Log with metadata
this.logger.customLog('User logged in', undefined, {
  userId: '123',
  ipAddress: '192.168.1.1',
});

// Log error with metadata
this.logger.customError(
  'Failed to process payment',
  error.stack,
  undefined,
  {
    userId: '123',
    paymentId: 'pay_123',
    amount: 100,
  }
);
```

### Different Log Levels

```typescript
// Log levels
this.logger.customLog('Info message');
this.logger.customError('Error message', error.stack);
this.logger.customWarn('Warning message');
this.logger.customDebug('Debug message');
this.logger.customVerbose('Verbose message');
```

## Configuration

The logging system is configured in the `app.module.ts` file. The `LoggerConfig` is initialized with the `ConfigService` in the `onModuleInit` lifecycle hook.

```typescript
@Module({
  // ...
})
export class AppModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Initialize LoggerConfig with ConfigService
    LoggerConfig.setConfigService(this.configService);
  }
}
```

## Log Files

The logging system creates the following log files in the `logs` directory:

- `combined.log`: All log messages
- `error.log`: Error-level messages only
- `exceptions.log`: Uncaught exceptions
- `guidance.log`: Guidance-related logs (if enabled)

## Configuration

The logging system can be configured using environment variables:

- `NODE_ENV`: Set to `production` to reduce console log verbosity
- `ENABLE_GUIDANCE_LOGS`: Set to `true` to enable guidance-specific logs

## Best Practices

1. Always provide a context when creating a logger
2. Use appropriate log levels:
   - `error`: For errors that affect functionality
   - `warn`: For potential issues or deprecated features
   - `log`: For general information
   - `debug`: For detailed debugging information
   - `verbose`: For very detailed information
3. Include relevant information in log messages
4. Use structured logging when appropriate
5. Handle errors gracefully and log them with stack traces
