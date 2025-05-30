import { Test } from '@nestjs/testing';
import { AppLoggerService } from './app-logger.service';
import { LoggerService } from './logger.service';
import { ConfigService } from '../../config';
import { LoggerConfig } from './logger.config';

describe('Logger Services', () => {
  let appLoggerService: AppLoggerService;
  let loggerService: LoggerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AppLoggerService,
          useFactory: () => {
            return new AppLoggerService('TestService');
          },
        },
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            isProduction: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    appLoggerService = moduleRef.get<AppLoggerService>(AppLoggerService);
    loggerService = moduleRef.get<LoggerService>(LoggerService);
    configService = moduleRef.get<ConfigService>(ConfigService);

    // Initialize LoggerConfig with ConfigService
    LoggerConfig.setConfigService(configService);
  });

  describe('AppLoggerService', () => {
    it('should be defined', () => {
      expect(appLoggerService).toBeDefined();
    });

    it('should log messages at different levels', () => {
      // Create spies for the logger methods
      const logSpy = jest.spyOn(appLoggerService['logger'], 'log');

      // Test different log levels
      appLoggerService.log('Info message', 'TestContext', { userId: '123' });
      appLoggerService.error('Error message', 'Error stack', 'TestContext', {
        userId: '123',
      });
      appLoggerService.warn('Warning message', 'TestContext', {
        userId: '123',
      });
      appLoggerService.debug('Debug message', 'TestContext', { userId: '123' });
      appLoggerService.verbose('Verbose message', 'TestContext', {
        userId: '123',
      });

      // Verify log calls
      expect(logSpy).toHaveBeenCalledTimes(5);

      // Verify log level for info message
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'Info message',
          context: 'TestContext',
          userId: '123',
        }),
      );

      // Verify log level for error message
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: 'Error message',
          context: 'TestContext',
          userId: '123',
          trace: 'Error stack',
        }),
      );
    });

    it('should set context correctly', () => {
      // Create spy for the logger
      const createLoggerSpy = jest.spyOn(LoggerConfig, 'createLogger');

      // Set context
      appLoggerService.setContext('NewContext');

      // Verify context was set
      expect(createLoggerSpy).toHaveBeenCalledWith('NewContext');
    });
  });

  describe('LoggerService', () => {
    it('should be defined', () => {
      expect(loggerService).toBeDefined();
    });

    it('should get logger instance for context', () => {
      const logger1 = LoggerService.getLogger('Context1');
      const logger2 = LoggerService.getLogger('Context1');
      const logger3 = LoggerService.getLogger('Context2');

      // Same context should return same instance
      expect(logger1).toBe(logger2);

      // Different context should return different instance
      expect(logger1).not.toBe(logger3);
    });

    it('should log messages with metadata', () => {
      // Create spy for the underlying AppLoggerService methods
      const logSpy = jest.spyOn(loggerService, 'log');
      const errorSpy = jest.spyOn(loggerService, 'error');
      const warnSpy = jest.spyOn(loggerService, 'warn');
      const debugSpy = jest.spyOn(loggerService, 'debug');
      const verboseSpy = jest.spyOn(loggerService, 'verbose');

      // Test custom log methods
      loggerService.customLog('Info message', 'TestContext', { userId: '123' });
      loggerService.customError('Error message', 'Error stack', 'TestContext', {
        userId: '123',
      });
      loggerService.customWarn('Warning message', 'TestContext', {
        userId: '123',
      });
      loggerService.customDebug('Debug message', 'TestContext', {
        userId: '123',
      });
      loggerService.customVerbose('Verbose message', 'TestContext', {
        userId: '123',
      });

      // Verify calls to underlying methods
      expect(logSpy).toHaveBeenCalledWith('Info message', 'TestContext', {
        userId: '123',
      });
      expect(errorSpy).toHaveBeenCalledWith(
        'Error message',
        'Error stack',
        'TestContext',
        { userId: '123' },
      );
      expect(warnSpy).toHaveBeenCalledWith('Warning message', 'TestContext', {
        userId: '123',
      });
      expect(debugSpy).toHaveBeenCalledWith('Debug message', 'TestContext', {
        userId: '123',
      });
      expect(verboseSpy).toHaveBeenCalledWith(
        'Verbose message',
        'TestContext',
        { userId: '123' },
      );
    });
  });
});
