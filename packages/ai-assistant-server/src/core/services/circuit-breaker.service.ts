import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

/**
 * Circuit state enum
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker options
 */
interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenSuccessThreshold: number;
}

/**
 * Circuit breaker service for handling external service failures
 */
@Injectable()
export class CircuitBreakerService implements OnModuleInit {
  private circuits: Map<
    string,
    {
      state: CircuitState;
      failures: number;
      lastFailure: number;
      halfOpenSuccesses: number;
      options: CircuitBreakerOptions;
    }
  > = new Map();

  constructor(
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
  ) {
    this.logger.setContext('CircuitBreakerService');
  }

  /**
   * Initialize default circuits
   */
  onModuleInit() {
    // Register default circuits for LLM providers
    this.registerCircuit('openai', {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      halfOpenSuccessThreshold: 2,
    });

    this.registerCircuit('anthropic', {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      halfOpenSuccessThreshold: 2,
    });

    this.logger.customLog('Circuit breaker service initialized');
  }

  /**
   * Register a new circuit
   * @param name Circuit name
   * @param options Circuit options
   */
  registerCircuit(
    name: string,
    options: Partial<CircuitBreakerOptions> = {},
  ): void {
    try {
      const defaultOptions: CircuitBreakerOptions = {
        failureThreshold: 5,
        resetTimeout: 30000, // 30 seconds
        halfOpenSuccessThreshold: 2,
      };

      this.circuits.set(name, {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailure: 0,
        halfOpenSuccesses: 0,
        options: { ...defaultOptions, ...options },
      });

      this.logger.customLog(`Registered circuit: ${name}`, 'CircuitBreaker', {
        options: { ...defaultOptions, ...options },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error registering circuit: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Check if a circuit is closed (can execute)
   * @param name Circuit name
   * @returns Whether the circuit is closed
   */
  canExecute(name: string): boolean {
    try {
      const circuit = this.circuits.get(name);
      if (!circuit) {
        this.logger.customWarn(`Circuit not found: ${name}`, 'CircuitBreaker');
        return true; // If circuit doesn't exist, allow execution
      }

      switch (circuit.state) {
        case CircuitState.CLOSED:
          return true;
        case CircuitState.OPEN:
          // Check if reset timeout has elapsed
          const now = Date.now();
          if (now - circuit.lastFailure > circuit.options.resetTimeout) {
            // Transition to half-open
            circuit.state = CircuitState.HALF_OPEN;
            circuit.halfOpenSuccesses = 0;
            this.logger.customLog(
              `Circuit transitioned to half-open: ${name}`,
              'CircuitBreaker',
            );

            return true;
          }
          return false;
        case CircuitState.HALF_OPEN:
          return true;
        default:
          return true;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error checking circuit: ${errorMessage}`,
        errorStack,
      );
      return true; // In case of error, allow execution
    }
  }

  /**
   * Record a successful execution
   * @param name Circuit name
   */
  recordSuccess(name: string): void {
    try {
      const circuit = this.circuits.get(name);
      if (!circuit) {
        this.logger.customWarn(`Circuit not found: ${name}`, 'CircuitBreaker');
        return;
      }

      if (circuit.state === CircuitState.HALF_OPEN) {
        circuit.halfOpenSuccesses++;
        if (
          circuit.halfOpenSuccesses >= circuit.options.halfOpenSuccessThreshold
        ) {
          // Transition back to closed
          circuit.state = CircuitState.CLOSED;
          circuit.failures = 0;
          this.logger.customLog(
            `Circuit transitioned to closed: ${name}`,
            'CircuitBreaker',
          );
        }
      } else if (circuit.state === CircuitState.CLOSED) {
        // Reset failures on success
        circuit.failures = 0;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording success: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Record a failed execution
   * @param name Circuit name
   * @param error Error that occurred
   */
  recordFailure(name: string, error?: Error): void {
    try {
      const circuit = this.circuits.get(name);
      if (!circuit) {
        this.logger.customWarn(`Circuit not found: ${name}`, 'CircuitBreaker');
        return;
      }

      circuit.lastFailure = Date.now();

      if (circuit.state === CircuitState.HALF_OPEN) {
        // Transition back to open
        circuit.state = CircuitState.OPEN;
        this.logger.customLog(
          `Circuit transitioned to open: ${name}`,
          'CircuitBreaker',
        );
      } else if (circuit.state === CircuitState.CLOSED) {
        circuit.failures++;
        if (circuit.failures >= circuit.options.failureThreshold) {
          // Transition to open
          circuit.state = CircuitState.OPEN;
          this.logger.customLog(
            `Circuit transitioned to open: ${name}`,
            'CircuitBreaker',
          );
        }
      }

      // Log circuit failure
      this.logger.customWarn(`Circuit failure: ${name}`, 'CircuitBreaker', {
        error: error?.message,
        state: circuit.state,
        failures: circuit.failures,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording failure: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Get the state of a circuit
   * @param name Circuit name
   * @returns Circuit state or "UNKNOWN" if not found
   */
  getState(name: string): string {
    try {
      const circuit = this.circuits.get(name);
      if (!circuit) {
        return 'UNKNOWN';
      }
      return circuit.state;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error getting circuit state: ${errorMessage}`,
        errorStack,
      );
      return 'UNKNOWN';
    }
  }

  /**
   * Reset a circuit to closed state
   * @param name Circuit name
   */
  resetCircuit(name: string): void {
    try {
      const circuit = this.circuits.get(name);
      if (!circuit) {
        this.logger.customWarn(`Circuit not found: ${name}`, 'CircuitBreaker');
        return;
      }

      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.halfOpenSuccesses = 0;

      this.logger.customLog(
        `Circuit reset to closed: ${name}`,
        'CircuitBreaker',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error resetting circuit: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Get all circuit states
   * @returns Map of circuit names to their states
   */
  getAllCircuits(): Record<
    string,
    { state: string; failures: number; lastFailure: number }
  > {
    try {
      const result: Record<
        string,
        { state: string; failures: number; lastFailure: number }
      > = {};

      this.circuits.forEach((circuit, name) => {
        result[name] = {
          state: circuit.state,
          failures: circuit.failures,
          lastFailure: circuit.lastFailure,
        };
      });

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error getting all circuits: ${errorMessage}`,
        errorStack,
      );
      return {};
    }
  }
}
