import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../logger.service';
import { ConfigService } from '../../../config/config.service';
import * as winston from 'winston';

// Mock winston
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    json: jest.fn(),
  };

  const mockTransport = jest.fn();

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    add: jest.fn(),
  };

  return {
    format: mockFormat,
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
    createLogger: jest.fn().mockReturnValue(mockLogger),
  };
});

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, string> = {
        NODE_ENV: 'test',
        LOG_LEVEL: 'info',
        LOG_DIR: './logs',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: 'APP_LOGGER_CONTEXT', useValue: 'TestLogger' },
        {
          provide: LoggerService,
          useFactory: (context: string) => {
            return new LoggerService(context);
          },
          inject: ['APP_LOGGER_CONTEXT'],
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create a winston logger with correct configuration', () => {
      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.printf).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.transports.File).toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should log a message with default context', () => {
      const message = 'Test message';
      service.log(message);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context: 'TestLogger',
        }),
      );
    });

    it('should log a message with custom context', () => {
      const message = 'Test message';
      const context = 'TestContext';
      service.log(message, context);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context,
        }),
      );
    });

    it('should log an object message', () => {
      const message = { test: 'data' };
      service.log(message);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: JSON.stringify(message),
          context: 'TestLogger',
        }),
      );
    });
  });

  describe('error', () => {
    it('should log an error message with default context', () => {
      const message = 'Test error';
      service.error(message);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context: 'TestLogger',
        }),
      );
    });

    it('should log an error message with trace and custom context', () => {
      const message = 'Test error';
      const trace = 'Error stack trace';
      const context = 'TestContext';
      service.error(message, trace, context);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          trace,
          context,
        }),
      );
    });

    it('should log an Error object', () => {
      const error = new Error('Test error');
      service.error('Error occurred', error.stack, 'LoggerService');

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error occurred',
          trace: error.stack,
          context: 'LoggerService',
        }),
      );
    });
  });

  describe('warn', () => {
    it('should log a warning message with default context', () => {
      const message = 'Test warning';
      service.warn(message);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context: 'TestLogger',
        }),
      );
    });

    it('should log a warning message with custom context', () => {
      const message = 'Test warning';
      const context = 'TestContext';
      service.warn(message, context);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context,
        }),
      );
    });
  });

  describe('debug', () => {
    it('should log a debug message with default context', () => {
      const message = 'Test debug';
      service.debug(message);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context: 'TestLogger',
        }),
      );
    });

    it('should log a debug message with custom context', () => {
      const message = 'Test debug';
      const context = 'TestContext';
      service.debug(message, context);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context,
        }),
      );
    });
  });

  describe('verbose', () => {
    it('should log a verbose message with default context', () => {
      const message = 'Test verbose';
      service.verbose(message);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.verbose).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context: 'TestLogger',
        }),
      );
    });

    it('should log a verbose message with custom context', () => {
      const message = 'Test verbose';
      const context = 'TestContext';
      service.verbose(message, context);

      const winstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
        ?.value;
      expect(winstonLogger.verbose).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          context,
        }),
      );
    });
  });
});
