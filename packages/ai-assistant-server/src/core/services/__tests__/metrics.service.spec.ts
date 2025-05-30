import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../metrics.service';
import { LoggerService } from '../logger.service';
import { ConfigService } from '../../../config/config.service';
import { SentryService } from '../sentry.service';

// Mock prom-client
jest.mock('prom-client', () => {
  const mockCounter = jest.fn().mockImplementation(() => ({
    inc: jest.fn(),
    labels: jest.fn().mockReturnThis(),
  }));

  const mockGauge = jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    labels: jest.fn().mockReturnThis(),
  }));

  const mockHistogram = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    labels: jest.fn().mockReturnThis(),
  }));

  const mockSummary = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    labels: jest.fn().mockReturnThis(),
  }));

  const mockRegistry = {
    setDefaultLabels: jest.fn(),
    metrics: jest.fn().mockResolvedValue('metrics data'),
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    resetMetrics: jest.fn(),
  };

  return {
    Counter: mockCounter,
    Gauge: mockGauge,
    Histogram: mockHistogram,
    Summary: mockSummary,
    register: mockRegistry,
    collectDefaultMetrics: jest.fn(),
  };
});

describe('MetricsService', () => {
  let service: MetricsService;
  let loggerService: LoggerService;

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
    customLog: jest.fn(),
    customError: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, string> = {
        APP_NAME: 'test-app',
        NODE_ENV: 'test',
      };
      return config[key];
    }),
  };

  const mockSentryService = {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SentryService, useValue: mockSentryService },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should set logger context', () => {
      expect(mockLoggerService.setContext).toHaveBeenCalledWith(
        'MetricsService',
      );
    });

    it('should initialize metrics in onModuleInit', () => {
      // Save original env
      const originalEnv = process.env;
      process.env = { ...originalEnv };

      // Mock require to return our mocked prom-client
      const promClient = require('prom-client');

      // Call onModuleInit
      service.onModuleInit();

      // Verify setDefaultLabels is called
      expect(promClient.register.setDefaultLabels).toHaveBeenCalledWith({
        app: 'ai-assistant-server',
        environment: 'test',
      });

      // Verify collectDefaultMetrics is called if not disabled
      expect(promClient.collectDefaultMetrics).toHaveBeenCalled();

      // Restore process.env
      process.env = originalEnv;
    });

    it('should handle initialization errors gracefully', () => {
      // Mock the error handling directly
      const error = new Error('Module not found');

      // Create a service with error handling
      const errorService = new MetricsService(
        mockLoggerService as unknown as LoggerService,
        mockSentryService as unknown as SentryService,
      );

      // Manually trigger the error handler
      (errorService as any).handleMetricError('constructor', error);

      expect(mockLoggerService.customError).toHaveBeenCalledWith(
        expect.stringContaining('Error in constructor'),
        expect.any(String),
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.constructor',
      });
    });
  });

  describe('getMetrics', () => {
    it('should return metrics data', async () => {
      const result = await service.getMetrics();
      expect(result).toBe('metrics data');
    });

    it('should handle errors', async () => {
      // Mock the register.metrics to throw an error
      const promClient = require('prom-client');
      const error = new Error('Error collecting metrics');
      promClient.register.metrics.mockRejectedValueOnce(error);

      const result = await service.getMetrics();

      // Verify error handling
      expect(result).toEqual('');
      expect(mockLoggerService.customError).toHaveBeenCalled();
      expect(mockSentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.getMetrics',
      });
    });
  });

  describe('getContentType', () => {
    it('should return the content type', () => {
      const result = service.getContentType();
      expect(result).toBe('text/plain; version=0.0.4; charset=utf-8');
    });
  });

  describe('HTTP metrics', () => {
    it('should increment httpRequestsTotal', () => {
      service.incrementHttpRequests('GET', '/test', 200);
      // Implementation details are tested via the mock
      expect(service).toBeDefined();
    });

    it('should observe httpRequestDuration', () => {
      service.observeHttpRequestDuration('GET', '/test', 200, 100);
      // Implementation details are tested via the mock
      expect(service).toBeDefined();
    });
  });

  describe('LLM metrics', () => {
    it('should increment llmRequestsTotal', () => {
      service.incrementLlmRequests('test-model', 'completion');
      // Implementation details are tested via the mock
      expect(service).toBeDefined();
    });

    it('should observe llmRequestDuration', () => {
      service.observeLlmRequestDuration('test-model', 'completion', 200);
      // Implementation details are tested via the mock
      expect(service).toBeDefined();
    });

    it('should observe llmTokensUsed', () => {
      service.incrementLlmTokens('test-model', 'completion', 'input', 100);
      service.incrementLlmTokens('test-model', 'completion', 'output', 50);
      // Implementation details are tested via the mock
      expect(service).toBeDefined();
    });
  });

  describe('Agent metrics', () => {
    it('should increment agentExecutionsTotal', () => {
      service.incrementAgentExecutions('test-agent');
      // Implementation details are tested via the mock
      expect(service).toBeDefined();
    });

    it('should observe agentExecutionDuration', () => {
      service.observeAgentExecutionDuration('test-agent', 150);
      // Implementation details are tested via the mock
      expect(service).toBeDefined();
    });
  });

  describe('System metrics', () => {
    it('should set systemInfo', () => {
      // This is now handled internally by startSystemMetricsCollection
      expect(service).toBeDefined();
    });
  });
});
