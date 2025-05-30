import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from '../circuit-breaker.service';
import { LoggerService } from '../logger.service';
import { SentryService } from '../sentry.service';
import { MetricsService } from '../metrics.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;
  let loggerService: LoggerService;
  let sentryService: SentryService;
  let metricsService: MetricsService;

  const mockLoggerService = {
    setContext: jest.fn(),
    customLog: jest.fn(),
    customError: jest.fn(),
    customWarn: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockSentryService = {
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
  };

  const mockMetricsService = {
    incrementHttpRequests: jest.fn(),
    observeHttpRequestDuration: jest.fn(),
    incrementLlmRequests: jest.fn(),
    observeLlmRequestDuration: jest.fn(),
    observeLlmTokens: jest.fn(),
    incrementAgentActions: jest.fn(),
    observeAgentActionDuration: jest.fn(),
    setSystemInfo: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerService,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SentryService, useValue: mockSentryService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
    loggerService = module.get<LoggerService>(LoggerService);
    sentryService = module.get<SentryService>(SentryService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should register default circuits', () => {
      // Spy on registerCircuit method
      const registerCircuitSpy = jest.spyOn(service, 'registerCircuit');

      // Call onModuleInit
      service.onModuleInit();

      // Verify default circuits are registered
      expect(registerCircuitSpy).toHaveBeenCalledWith('openai', {
        failureThreshold: 5,
        resetTimeout: 30000,
        halfOpenSuccessThreshold: 2,
      });

      expect(registerCircuitSpy).toHaveBeenCalledWith('anthropic', {
        failureThreshold: 5,
        resetTimeout: 30000,
        halfOpenSuccessThreshold: 2,
      });

      expect(mockLoggerService.customLog).toHaveBeenCalledWith(
        'Circuit breaker service initialized',
      );
    });
  });

  describe('registerCircuit', () => {
    it('should register a circuit with default options', () => {
      service.registerCircuit('test-circuit');

      // Check if the circuit is registered by using getState
      expect(service.getState('test-circuit')).toBe('CLOSED');
      expect(mockLoggerService.customLog).toHaveBeenCalledWith(
        'Registered circuit: test-circuit',
        'CircuitBreaker',
        expect.any(Object),
      );
    });

    it('should register a circuit with custom options', () => {
      const customOptions = {
        failureThreshold: 3,
        resetTimeout: 60000,
        halfOpenSuccessThreshold: 1,
      };

      service.registerCircuit('test-circuit', customOptions);

      expect(service.getState('test-circuit')).toBe('CLOSED');
      expect(mockLoggerService.customLog).toHaveBeenCalledWith(
        'Registered circuit: test-circuit',
        'CircuitBreaker',
        expect.objectContaining({
          options: expect.objectContaining(customOptions),
        }),
      );
    });

    it('should handle errors during registration', () => {
      // Mock an error during registration
      jest.spyOn(service['circuits'], 'set').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      service.registerCircuit('test-circuit');

      expect(mockLoggerService.customError).toHaveBeenCalledWith(
        'Error registering circuit: Test error',
        expect.any(String),
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'CircuitBreakerService.registerCircuit',
        },
      );
    });
  });

  describe('canExecute', () => {
    it('should return true for a closed circuit', () => {
      service.registerCircuit('test-circuit');
      expect(service.canExecute('test-circuit')).toBe(true);
    });

    it('should return true for a non-existent circuit', () => {
      expect(service.canExecute('non-existent')).toBe(true);
      expect(mockLoggerService.customWarn).toHaveBeenCalledWith(
        'Circuit not found: non-existent',
        'CircuitBreaker',
      );
    });

    it('should return false for an open circuit', () => {
      service.registerCircuit('test-circuit');

      // Simulate failures to open the circuit
      for (let i = 0; i < 5; i++) {
        service.recordFailure('test-circuit');
      }

      expect(service.getState('test-circuit')).toBe('OPEN');
      expect(service.canExecute('test-circuit')).toBe(false);
    });

    it('should transition from open to half-open after reset timeout', () => {
      service.registerCircuit('test-circuit', { resetTimeout: 100 });

      // Simulate failures to open the circuit
      for (let i = 0; i < 5; i++) {
        service.recordFailure('test-circuit');
      }

      expect(service.getState('test-circuit')).toBe('OPEN');
      expect(service.canExecute('test-circuit')).toBe(false);

      // Fast-forward time
      jest.useFakeTimers();
      jest.advanceTimersByTime(200);

      // Now it should be half-open
      expect(service.canExecute('test-circuit')).toBe(true);
      expect(service.getState('test-circuit')).toBe('HALF_OPEN');
      expect(mockLoggerService.customLog).toHaveBeenCalledWith(
        'Circuit transitioned to half-open: test-circuit',
        'CircuitBreaker',
      );
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'circuit-breaker',
          message: 'Circuit transitioned to half-open: test-circuit',
          level: 'info',
        }),
      );

      jest.useRealTimers();
    });

    it('should handle errors during execution check', () => {
      service.registerCircuit('test-circuit');

      // Mock an error during execution check
      jest.spyOn(service['circuits'], 'get').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      // Should return true in case of error
      expect(service.canExecute('test-circuit')).toBe(true);
      expect(mockLoggerService.customError).toHaveBeenCalledWith(
        'Error checking circuit: Test error',
        expect.any(String),
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'CircuitBreakerService.canExecute',
        },
      );
    });
  });

  describe('recordSuccess', () => {
    it('should reset failures for a closed circuit', () => {
      service.registerCircuit('test-circuit');

      // Simulate some failures but not enough to open
      service.recordFailure('test-circuit');
      service.recordFailure('test-circuit');

      // Record success
      service.recordSuccess('test-circuit');

      // Circuit should still be closed
      expect(service.getState('test-circuit')).toBe('CLOSED');
    });

    it('should transition from half-open to closed after enough successes', () => {
      service.registerCircuit('test-circuit', {
        halfOpenSuccessThreshold: 2,
        resetTimeout: 100,
      });

      // Simulate failures to open the circuit
      for (let i = 0; i < 5; i++) {
        service.recordFailure('test-circuit');
      }

      // Fast-forward time to transition to half-open
      jest.useFakeTimers();
      jest.advanceTimersByTime(200);
      service.canExecute('test-circuit'); // This call will transition to half-open

      // Record successes
      service.recordSuccess('test-circuit');
      expect(service.getState('test-circuit')).toBe('HALF_OPEN');

      service.recordSuccess('test-circuit');
      expect(service.getState('test-circuit')).toBe('CLOSED');
      expect(mockLoggerService.customLog).toHaveBeenCalledWith(
        'Circuit transitioned to closed: test-circuit',
        'CircuitBreaker',
      );
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'circuit-breaker',
          message: 'Circuit transitioned to closed: test-circuit',
          level: 'info',
        }),
      );

      jest.useRealTimers();
    });

    it('should handle non-existent circuit', () => {
      service.recordSuccess('non-existent');
      expect(mockLoggerService.customWarn).toHaveBeenCalledWith(
        'Circuit not found: non-existent',
        'CircuitBreaker',
      );
    });

    it('should handle errors during success recording', () => {
      service.registerCircuit('test-circuit');

      // Mock an error during success recording
      jest.spyOn(service['circuits'], 'get').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      service.recordSuccess('test-circuit');
      expect(mockLoggerService.customError).toHaveBeenCalledWith(
        'Error recording success: Test error',
        expect.any(String),
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'CircuitBreakerService.recordSuccess',
        },
      );
    });
  });

  describe('recordFailure', () => {
    it('should increment failures for a closed circuit', () => {
      service.registerCircuit('test-circuit');

      service.recordFailure('test-circuit');
      expect(service.getState('test-circuit')).toBe('CLOSED');
    });

    it('should transition from closed to open after threshold failures', () => {
      service.registerCircuit('test-circuit', { failureThreshold: 3 });

      // Record failures
      service.recordFailure('test-circuit');
      service.recordFailure('test-circuit');
      expect(service.getState('test-circuit')).toBe('CLOSED');

      service.recordFailure('test-circuit');
      expect(service.getState('test-circuit')).toBe('OPEN');
      expect(mockLoggerService.customLog).toHaveBeenCalledWith(
        'Circuit transitioned to open: test-circuit',
        'CircuitBreaker',
      );
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'circuit-breaker',
          message: 'Circuit transitioned to open: test-circuit',
          level: 'warning',
        }),
      );
    });

    it('should transition from half-open to open on failure', () => {
      service.registerCircuit('test-circuit', { resetTimeout: 100 });

      // Simulate failures to open the circuit
      for (let i = 0; i < 5; i++) {
        service.recordFailure('test-circuit');
      }

      // Fast-forward time to transition to half-open
      jest.useFakeTimers();
      jest.advanceTimersByTime(200);
      service.canExecute('test-circuit'); // This call will transition to half-open

      // Record a failure in half-open state
      service.recordFailure('test-circuit');
      expect(service.getState('test-circuit')).toBe('OPEN');
      expect(mockLoggerService.customLog).toHaveBeenCalledWith(
        'Circuit transitioned to open: test-circuit',
        'CircuitBreaker',
      );

      jest.useRealTimers();
    });

    it('should handle non-existent circuit', () => {
      service.recordFailure('non-existent');
      expect(mockLoggerService.customWarn).toHaveBeenCalledWith(
        'Circuit not found: non-existent',
        'CircuitBreaker',
      );
    });

    it('should handle errors during failure recording', () => {
      service.registerCircuit('test-circuit');

      // Mock an error during failure recording
      jest.spyOn(service['circuits'], 'get').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      service.recordFailure('test-circuit');
      expect(mockLoggerService.customError).toHaveBeenCalledWith(
        'Error recording failure: Test error',
        expect.any(String),
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'CircuitBreakerService.recordFailure',
        },
      );
    });
  });

  describe('getState', () => {
    it('should return the current state of a circuit', () => {
      service.registerCircuit('test-circuit');
      expect(service.getState('test-circuit')).toBe('CLOSED');

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        service.recordFailure('test-circuit');
      }
      expect(service.getState('test-circuit')).toBe('OPEN');
    });

    it('should return UNKNOWN for a non-existent circuit', () => {
      expect(service.getState('non-existent')).toBe('UNKNOWN');
    });

    it('should handle errors during state retrieval', () => {
      service.registerCircuit('test-circuit');

      // Mock an error during state retrieval
      jest.spyOn(service['circuits'], 'get').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      expect(service.getState('test-circuit')).toBe('UNKNOWN');
      expect(mockLoggerService.customError).toHaveBeenCalledWith(
        'Error getting state: Test error',
        expect.any(String),
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'CircuitBreakerService.getState',
        },
      );
    });
  });

  describe('resetCircuit', () => {
    it('should reset a circuit to closed state', () => {
      service.registerCircuit('test-circuit');

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        service.recordFailure('test-circuit');
      }
      expect(service.getState('test-circuit')).toBe('OPEN');

      // Reset the circuit
      service.resetCircuit('test-circuit');
      expect(service.getState('test-circuit')).toBe('CLOSED');
      expect(mockLoggerService.customLog).toHaveBeenCalledWith(
        'Circuit reset to closed: test-circuit',
        'CircuitBreaker',
      );
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'circuit-breaker',
          message: 'Circuit reset to closed: test-circuit',
          level: 'info',
        }),
      );
    });

    it('should handle non-existent circuit', () => {
      service.resetCircuit('non-existent');
      expect(mockLoggerService.customWarn).toHaveBeenCalledWith(
        'Circuit not found: non-existent',
        'CircuitBreaker',
      );
    });

    it('should handle errors during circuit reset', () => {
      service.registerCircuit('test-circuit');

      // Mock an error during circuit reset
      jest.spyOn(service['circuits'], 'get').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      service.resetCircuit('test-circuit');
      expect(mockLoggerService.customError).toHaveBeenCalledWith(
        'Error resetting circuit: Test error',
        expect.any(String),
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'CircuitBreakerService.resetCircuit',
        },
      );
    });
  });
});
