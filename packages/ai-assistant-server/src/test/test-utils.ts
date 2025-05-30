import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../core/services/logger.service';
import { ConfigService } from '../config/config.service';

/**
 * Creates a mock LoggerService for testing
 */
export const createMockLoggerService = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

/**
 * Creates a mock ConfigService for testing
 * @param config - Optional configuration object to override default values
 */
export const createMockConfigService = (config: Record<string, any> = {}) => ({
  get: jest.fn().mockImplementation((key: string) => {
    const defaultConfig = {
      NODE_ENV: 'test',
      APP_NAME: 'test-app',
      LOG_LEVEL: 'info',
      LOG_DIR: './logs',
      CACHE_TTL: '3600',
    };

    return config[key] !== undefined ? config[key] : defaultConfig[key as keyof typeof defaultConfig];
  }),
});

/**
 * Creates common providers for testing
 * @param overrides - Optional providers to override default mocks
 */
export const createCommonProviders = (overrides: Record<string, any> = {}) => {
  const mockLoggerService =
    overrides.LoggerService || createMockLoggerService();
  const mockConfigService =
    overrides.ConfigService || createMockConfigService();

  return [
    { provide: LoggerService, useValue: mockLoggerService },
    { provide: ConfigService, useValue: mockConfigService },
  ];
};

/**
 * Creates a test module with common providers
 * @param metadata - Module metadata
 * @param overrides - Optional providers to override default mocks
 */
export const createTestingModuleWithCommonProviders = async (
  metadata: ModuleMetadata,
  overrides: Record<string, any> = {},
): Promise<TestingModule> => {
  const commonProviders = createCommonProviders(overrides);

  const moduleMetadata: ModuleMetadata = {
    ...metadata,
    providers: [...(metadata.providers || []), ...commonProviders],
  };

  return Test.createTestingModule(moduleMetadata).compile();
};

/**
 * Waits for a specified time
 * @param ms - Milliseconds to wait
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Creates a mock HTTP request object
 * @param overrides - Optional properties to override defaults
 */
export const createMockRequest = (overrides: Record<string, any> = {}) => ({
  url: '/test',
  method: 'GET',
  headers: {},
  query: {},
  params: {},
  body: {},
  ip: '127.0.0.1',
  ...overrides,
});

/**
 * Creates a mock HTTP response object
 */
export const createMockResponse = () => {
  const res: Record<string, any> = {
    statusCode: 200,
    headers: new Map(),
    body: null,
  };

  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn().mockImplementation((body) => {
    res.body = body;
    return res;
  });

  res.send = jest.fn().mockImplementation((body) => {
    res.body = body;
    return res;
  });

  res.setHeader = jest.fn().mockImplementation((name, value) => {
    res.headers.set(name, value);
    return res;
  });

  res.getHeader = jest.fn().mockImplementation((name) => {
    return res.headers.get(name);
  });

  return res;
};

/**
 * Creates a mock Prisma client for testing
 * @param overrides - Optional methods to override defaults
 */
export const createMockPrismaClient = (overrides: Record<string, any> = {}) => {
  const defaultMock = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Add other models as needed
    $transaction: jest.fn((callback) => callback()),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Utility to test async errors
 * @param fn - Function that should throw an error
 */
export const expectAsyncError = async (
  fn: () => Promise<any>,
  errorType?: any,
): Promise<Error> => {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    if (errorType && !(error instanceof errorType)) {
      throw new Error(`Expected error to be instance of ${errorType.name}`);
    }
    return error as Error;
  }
};
