import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from './logger.service';
import type { register, Counter, Gauge, Histogram, Summary } from 'prom-client';

/**
 * Service for collecting and exposing metrics
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  // HTTP metrics
  public readonly httpRequestsTotal: Counter;
  public readonly httpRequestDuration: Histogram;
  public readonly httpRequestsInProgress: Gauge;

  // LLM metrics
  public readonly llmRequestsTotal: Counter;
  public readonly llmRequestDuration: Histogram;
  public readonly llmTokensUsed: Counter;
  public readonly llmCacheHits: Counter;
  public readonly llmCacheMisses: Counter;

  // Agent metrics
  public readonly agentExecutionsTotal: Counter;
  public readonly agentExecutionDuration: Histogram;
  public readonly agentExecutionSteps: Histogram;

  // System metrics
  public readonly memoryUsage: Gauge;
  public readonly cpuUsage: Gauge;

  private readonly register: typeof register;

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('MetricsService');

    try {
      // Import prom-client dynamically to avoid issues with SSR
      const promClient = require('prom-client');
      this.register = promClient.register;

      // Initialize HTTP metrics
      this.httpRequestsTotal = new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'path', 'status'],
      });

      this.httpRequestDuration = new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'path', 'status'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      });

      this.httpRequestsInProgress = new promClient.Gauge({
        name: 'http_requests_in_progress',
        help: 'Number of HTTP requests in progress',
        labelNames: ['method', 'path'],
      });

      // Initialize LLM metrics
      this.llmRequestsTotal = new promClient.Counter({
        name: 'llm_requests_total',
        help: 'Total number of LLM requests',
        labelNames: ['model', 'provider'],
      });

      this.llmRequestDuration = new promClient.Histogram({
        name: 'llm_request_duration_seconds',
        help: 'LLM request duration in seconds',
        labelNames: ['model', 'provider'],
        buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30],
      });

      this.llmTokensUsed = new promClient.Counter({
        name: 'llm_tokens_used_total',
        help: 'Total number of tokens used in LLM requests',
        labelNames: ['model', 'type'],
      });

      this.llmCacheHits = new promClient.Counter({
        name: 'llm_cache_hits_total',
        help: 'Total number of LLM cache hits',
        labelNames: ['model'],
      });

      this.llmCacheMisses = new promClient.Counter({
        name: 'llm_cache_misses_total',
        help: 'Total number of LLM cache misses',
        labelNames: ['model'],
      });

      // Initialize Agent metrics
      this.agentExecutionsTotal = new promClient.Counter({
        name: 'agent_executions_total',
        help: 'Total number of agent executions',
        labelNames: ['agent'],
      });

      this.agentExecutionDuration = new promClient.Histogram({
        name: 'agent_execution_duration_seconds',
        help: 'Agent execution duration in seconds',
        labelNames: ['agent'],
        buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
      });

      this.agentExecutionSteps = new promClient.Histogram({
        name: 'agent_execution_steps',
        help: 'Number of steps in agent execution',
        labelNames: ['agent'],
        buckets: [1, 2, 3, 5, 10, 15, 20, 30],
      });

      // Initialize System metrics
      this.memoryUsage = new promClient.Gauge({
        name: 'process_memory_usage_bytes',
        help: 'Process memory usage in bytes',
        labelNames: ['type'],
      });

      this.cpuUsage = new promClient.Gauge({
        name: 'process_cpu_usage_percentage',
        help: 'Process CPU usage percentage',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error initializing metrics: ${errorMessage}`,
        errorStack,
      );

      // Initialize with dummy objects to prevent null reference errors
      const dummyMetric = {
        inc: () => {},
        dec: () => {},
        observe: () => {},
        set: () => {},
      };

      this.httpRequestsTotal = dummyMetric as any;
      this.httpRequestDuration = dummyMetric as any;
      this.httpRequestsInProgress = dummyMetric as any;
      this.llmRequestsTotal = dummyMetric as any;
      this.llmRequestDuration = dummyMetric as any;
      this.llmTokensUsed = dummyMetric as any;
      this.llmCacheHits = dummyMetric as any;
      this.llmCacheMisses = dummyMetric as any;
      this.agentExecutionsTotal = dummyMetric as any;
      this.agentExecutionDuration = dummyMetric as any;
      this.agentExecutionSteps = dummyMetric as any;
      this.memoryUsage = dummyMetric as any;
      this.cpuUsage = dummyMetric as any;
      this.register = {
        metrics: () => '',
        clear: () => {},
        collectDefaultMetrics: () => {},
      } as any;
    }
  }

  onModuleInit() {
    try {
      // Register default metrics (memory, CPU, etc.)
      this.register.setDefaultLabels({
        app: 'ai-assistant-server',
        environment: process.env.NODE_ENV || 'development',
      });

      // Start collecting default metrics
      if (process.env.COLLECT_DEFAULT_METRICS !== 'false') {
        const promClient = require('prom-client');
        promClient.collectDefaultMetrics({
          prefix: 'app_',
          labels: { app: 'ai-assistant-server' },
        });
      }

      // Start collecting system metrics
      this.startSystemMetricsCollection();

      this.logger.customLog('Metrics service initialized');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error in onModuleInit: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Start collecting system metrics
   */
  private startSystemMetricsCollection() {
    // Collect system metrics every 15 seconds
    setInterval(() => {
      try {
        const memoryUsage = process.memoryUsage();
        this.memoryUsage.set({ type: 'rss' }, memoryUsage.rss);
        this.memoryUsage.set({ type: 'heapTotal' }, memoryUsage.heapTotal);
        this.memoryUsage.set({ type: 'heapUsed' }, memoryUsage.heapUsed);
        this.memoryUsage.set({ type: 'external' }, memoryUsage.external);

        // CPU usage is more complex and would require additional libraries
        // This is a simplified version
        const startUsage = process.cpuUsage();
        setTimeout(() => {
          const endUsage = process.cpuUsage(startUsage);
          const totalUsage = endUsage.user + endUsage.system;
          // Convert to percentage of CPU time over the measurement interval
          const cpuPercent = (totalUsage / 1000000) * 100;
          this.cpuUsage.set(cpuPercent);
        }, 100);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.customError(
          `Error collecting system metrics: ${errorMessage}`,
          errorStack,
        );
      }
    }, 15000);
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    try {
      return await this.register.metrics();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error getting metrics: ${errorMessage}`,
        errorStack,
      );
      return '';
    }
  }

  /**
   * Get content type for Prometheus metrics
   */
  getContentType(): string {
    return this.register.contentType;
  }

  /**
   * Increment HTTP requests counter
   */
  incrementHttpRequests(method: string, path: string, status: number): void {
    try {
      this.httpRequestsTotal.labels({ method, path, status }).inc();
    } catch (error: unknown) {
      this.handleMetricError('incrementHttpRequests', error);
    }
  }

  /**
   * Observe HTTP request duration
   */
  observeHttpRequestDuration(
    method: string,
    path: string,
    status: number,
    duration: number,
  ): void {
    try {
      this.httpRequestDuration
        .labels({ method, path, status })
        .observe(duration);
    } catch (error: unknown) {
      this.handleMetricError('observeHttpRequestDuration', error);
    }
  }

  /**
   * Increment LLM requests counter
   */
  incrementLlmRequests(model: string, provider: string): void {
    try {
      this.llmRequestsTotal.labels({ model, provider }).inc();
    } catch (error: unknown) {
      this.handleMetricError('incrementLlmRequests', error);
    }
  }

  /**
   * Observe LLM request duration
   */
  observeLlmRequestDuration(
    model: string,
    provider: string,
    duration: number,
  ): void {
    try {
      this.llmRequestDuration.labels({ model, provider }).observe(duration);
    } catch (error: unknown) {
      this.handleMetricError('observeLlmRequestDuration', error);
    }
  }

  /**
   * Increment LLM tokens counter
   */
  incrementLlmTokens(
    model: string,
    provider: string,
    type: string,
    tokens: number,
  ): void {
    try {
      this.llmTokensUsed.labels({ model, type }).inc(tokens);
    } catch (error: unknown) {
      this.handleMetricError('incrementLlmTokens', error);
    }
  }

  /**
   * Increment LLM cache hits counter
   */
  incrementLlmCacheHits(model: string): void {
    try {
      this.llmCacheHits.labels({ model }).inc();
    } catch (error: unknown) {
      this.handleMetricError('incrementLlmCacheHits', error);
    }
  }

  /**
   * Increment LLM cache misses counter
   */
  incrementLlmCacheMisses(model: string): void {
    try {
      this.llmCacheMisses.labels({ model }).inc();
    } catch (error: unknown) {
      this.handleMetricError('incrementLlmCacheMisses', error);
    }
  }

  /**
   * Increment agent executions counter
   */
  incrementAgentExecutions(agent: string): void {
    try {
      this.agentExecutionsTotal.labels({ agent }).inc();
    } catch (error: unknown) {
      this.handleMetricError('incrementAgentExecutions', error);
    }
  }

  /**
   * Observe agent execution duration
   */
  observeAgentExecutionDuration(agent: string, duration: number): void {
    try {
      this.agentExecutionDuration.labels({ agent }).observe(duration);
    } catch (error: unknown) {
      this.handleMetricError('observeAgentExecutionDuration', error);
    }
  }

  /**
   * Observe agent execution steps
   */
  observeAgentExecutionSteps(agent: string, steps: number): void {
    try {
      this.agentExecutionSteps.labels({ agent }).observe(steps);
    } catch (error: unknown) {
      this.handleMetricError('observeAgentExecutionSteps', error);
    }
  }

  /**
   * Handle metric error
   */
  private handleMetricError(method: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.logger.customError(`Error in ${method}: ${errorMessage}`, errorStack);
  }

  /**
   * Reset all metrics
   */
  async resetMetrics(): Promise<void> {
    try {
      this.register.resetMetrics();
      this.logger.customLog('Metrics reset');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error resetting metrics: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Record HTTP request start
   */
  recordHttpRequestStart(method: string, path: string): void {
    try {
      this.httpRequestsInProgress.inc({ method, path });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording HTTP request start: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Record HTTP request end
   */
  recordHttpRequestEnd(
    method: string,
    path: string,
    status: number,
    duration: number,
  ): void {
    try {
      this.httpRequestsTotal.inc({ method, path, status });
      this.httpRequestDuration.observe({ method, path, status }, duration);
      this.httpRequestsInProgress.dec({ method, path });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording HTTP request end: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Record LLM request
   */
  recordLlmRequest(
    model: string,
    status: string,
    duration: number,
    promptTokens: number,
    completionTokens: number,
  ): void {
    try {
      this.llmRequestsTotal.inc({ model, status });
      this.llmRequestDuration.observe({ model, status }, duration);
      this.llmTokensUsed.inc({ model, type: 'prompt' }, promptTokens);
      this.llmTokensUsed.inc({ model, type: 'completion' }, completionTokens);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording LLM request: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Record LLM cache hit
   */
  recordLlmCacheHit(model: string): void {
    try {
      this.llmCacheHits.inc({ model });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording LLM cache hit: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Record LLM cache miss
   */
  recordLlmCacheMiss(model: string): void {
    try {
      this.llmCacheMisses.inc({ model });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording LLM cache miss: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Record agent execution
   */
  recordAgentExecution(
    agent: string,
    status: string,
    duration: number,
    steps: number,
  ): void {
    try {
      this.agentExecutionsTotal.inc({ agent });
      this.agentExecutionDuration.observe({ agent }, duration);
      this.agentExecutionSteps.observe({ agent }, steps);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error recording agent execution: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
