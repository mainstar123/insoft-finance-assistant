import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { LoggerService } from './logger.service';
import { SentryService } from './sentry.service';
import {
  mockLoggerService,
  mockSentryService,
} from '@/test/mocks/service-mocks';

// Mock prom-client
jest.mock('prom-client', () => {
  const mockCounter = jest.fn().mockImplementation(() => ({
    inc: jest.fn(),
  }));

  const mockHistogram = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
  }));

  const mockGauge = jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    inc: jest.fn(),
    dec: jest.fn(),
  }));

  return {
    Counter: mockCounter,
    Histogram: mockHistogram,
    Gauge: mockGauge,
    register: {
      metrics: jest.fn().mockResolvedValue('metrics data'),
      resetMetrics: jest.fn(),
      setDefaultLabels: jest.fn(),
      collectDefaultMetrics: jest.fn(),
    },
  };
});

describe('MetricsService', () => {
  let service: MetricsService;
  let loggerService: jest.Mocked<LoggerService>;
  let sentryService: jest.Mocked<SentryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: SentryService,
          useValue: mockSentryService,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    loggerService = module.get(LoggerService) as jest.Mocked<LoggerService>;
    sentryService = module.get(SentryService) as jest.Mocked<SentryService>;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should set logger context', () => {
      expect(loggerService.setContext).toHaveBeenCalledWith('MetricsService');
    });

    it('should initialize metrics in onModuleInit', () => {
      // Mock process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv, NODE_ENV: 'test' };

      // Call onModuleInit
      service.onModuleInit();

      // Verify default labels are set
      const promClient = require('prom-client');
      expect(promClient.register.setDefaultLabels).toHaveBeenCalledWith({
        app: 'ai-assistant-server',
        environment: 'test',
      });

      // Verify collectDefaultMetrics is called if not disabled
      expect(promClient.collectDefaultMetrics).toHaveBeenCalled();

      // Restore process.env
      process.env = originalEnv;
    });

    it('should handle errors in onModuleInit', () => {
      // Mock register.setDefaultLabels to throw an error
      const promClient = require('prom-client');
      const error = new Error('Test error');
      promClient.register.setDefaultLabels.mockImplementationOnce(() => {
        throw error;
      });

      // Call onModuleInit
      service.onModuleInit();

      // Verify error handling
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.onModuleInit',
      });
    });
  });

  describe('getMetrics', () => {
    it('should return metrics data', async () => {
      const result = await service.getMetrics();
      expect(result).toEqual('metrics data');
    });

    it('should handle errors', async () => {
      // Mock register.metrics to throw an error
      const promClient = require('prom-client');
      const error = new Error('Test error');
      promClient.register.metrics.mockRejectedValueOnce(error);

      // Call getMetrics
      const result = await service.getMetrics();

      // Verify error handling
      expect(result).toEqual('Error collecting metrics');
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.getMetrics',
      });
    });
  });

  describe('resetMetrics', () => {
    it('should reset metrics', async () => {
      await service.resetMetrics();

      const promClient = require('prom-client');
      expect(promClient.register.resetMetrics).toHaveBeenCalled();
      expect(loggerService.customLog).toHaveBeenCalledWith('Metrics reset');
    });

    it('should handle errors', async () => {
      // Mock register.resetMetrics to throw an error
      const promClient = require('prom-client');
      const error = new Error('Test error');
      promClient.register.resetMetrics.mockImplementationOnce(() => {
        throw error;
      });

      // Call resetMetrics
      await service.resetMetrics();

      // Verify error handling
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.resetMetrics',
      });
    });
  });

  describe('recordHttpRequestStart', () => {
    it('should increment in-progress counter', () => {
      service.recordHttpRequestStart('GET', '/test');

      expect(service.httpRequestsInProgress.inc).toHaveBeenCalledWith({
        method: 'GET',
        path: '/test',
      });
    });

    it('should handle errors', () => {
      // Mock httpRequestsInProgress.inc to throw an error
      const error = new Error('Test error');
      service.httpRequestsInProgress.inc = jest
        .fn()
        .mockImplementationOnce(() => {
          throw error;
        });

      // Call recordHttpRequestStart
      service.recordHttpRequestStart('GET', '/test');

      // Verify error handling
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.recordHttpRequestStart',
      });
    });
  });

  describe('recordHttpRequestEnd', () => {
    it('should record HTTP request metrics', () => {
      service.recordHttpRequestEnd('GET', '/test', 200, 0.1);

      expect(service.httpRequestsTotal.inc).toHaveBeenCalledWith({
        method: 'GET',
        path: '/test',
        status: 200,
      });

      expect(service.httpRequestDuration.observe).toHaveBeenCalledWith(
        { method: 'GET', path: '/test', status: 200 },
        0.1,
      );

      expect(service.httpRequestsInProgress.dec).toHaveBeenCalledWith({
        method: 'GET',
        path: '/test',
      });
    });

    it('should handle errors', () => {
      // Mock httpRequestsTotal.inc to throw an error
      const error = new Error('Test error');
      service.httpRequestsTotal.inc = jest.fn().mockImplementationOnce(() => {
        throw error;
      });

      // Call recordHttpRequestEnd
      service.recordHttpRequestEnd('GET', '/test', 200, 0.1);

      // Verify error handling
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.recordHttpRequestEnd',
      });
    });
  });

  describe('recordLlmRequest', () => {
    it('should record LLM request metrics', () => {
      service.recordLlmRequest('gpt-4', 'success', 0.5, 100, 50);

      expect(service.llmRequestsTotal.inc).toHaveBeenCalledWith({
        model: 'gpt-4',
        status: 'success',
      });

      expect(service.llmRequestDuration.observe).toHaveBeenCalledWith(
        { model: 'gpt-4', status: 'success' },
        0.5,
      );

      expect(service.llmTokensUsed.inc).toHaveBeenCalledWith(
        { model: 'gpt-4', type: 'prompt' },
        100,
      );

      expect(service.llmTokensUsed.inc).toHaveBeenCalledWith(
        { model: 'gpt-4', type: 'completion' },
        50,
      );
    });

    it('should handle errors', () => {
      // Mock llmRequestsTotal.inc to throw an error
      const error = new Error('Test error');
      service.llmRequestsTotal.inc = jest.fn().mockImplementationOnce(() => {
        throw error;
      });

      // Call recordLlmRequest
      service.recordLlmRequest('gpt-4', 'success', 0.5, 100, 50);

      // Verify error handling
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.recordLlmRequest',
      });
    });
  });

  describe('recordLlmCacheHit', () => {
    it('should increment cache hit counter', () => {
      service.recordLlmCacheHit('gpt-4');

      expect(service.llmCacheHits.inc).toHaveBeenCalledWith({
        model: 'gpt-4',
      });
    });

    it('should handle errors', () => {
      // Mock llmCacheHits.inc to throw an error
      const error = new Error('Test error');
      service.llmCacheHits.inc = jest.fn().mockImplementationOnce(() => {
        throw error;
      });

      // Call recordLlmCacheHit
      service.recordLlmCacheHit('gpt-4');

      // Verify error handling
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.recordLlmCacheHit',
      });
    });
  });

  describe('recordLlmCacheMiss', () => {
    it('should increment cache miss counter', () => {
      service.recordLlmCacheMiss('gpt-4');

      expect(service.llmCacheMisses.inc).toHaveBeenCalledWith({
        model: 'gpt-4',
      });
    });

    it('should handle errors', () => {
      // Mock llmCacheMisses.inc to throw an error
      const error = new Error('Test error');
      service.llmCacheMisses.inc = jest.fn().mockImplementationOnce(() => {
        throw error;
      });

      // Call recordLlmCacheMiss
      service.recordLlmCacheMiss('gpt-4');

      // Verify error handling
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.recordLlmCacheMiss',
      });
    });
  });

  describe('recordAgentExecution', () => {
    it('should record agent execution metrics', () => {
      service.recordAgentExecution('test-agent', 'success', 1.5, 5);

      expect(service.agentExecutionsTotal.inc).toHaveBeenCalledWith({
        agent: 'test-agent',
      });

      expect(service.agentExecutionDuration.observe).toHaveBeenCalledWith(
        { agent: 'test-agent' },
        1.5,
      );

      expect(service.agentExecutionSteps.observe).toHaveBeenCalledWith(
        { agent: 'test-agent' },
        5,
      );
    });

    it('should handle errors', () => {
      // Mock agentExecutionsTotal.inc to throw an error
      const error = new Error('Test error');
      service.agentExecutionsTotal.inc = jest
        .fn()
        .mockImplementationOnce(() => {
          throw error;
        });

      // Call recordAgentExecution
      service.recordAgentExecution('test-agent', 'success', 1.5, 5);

      // Verify error handling
      expect(loggerService.customError).toHaveBeenCalled();
      expect(sentryService.captureException).toHaveBeenCalledWith(error, {
        context: 'MetricsService.recordAgentExecution',
      });
    });
  });
});
