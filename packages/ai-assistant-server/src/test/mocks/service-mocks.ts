
/**
 * Mock for LoggerService
 */
export const mockLoggerService = {
  setContext: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  customLog: jest.fn(),
  customError: jest.fn(),
  customWarn: jest.fn(),
  customDebug: jest.fn(),
  customVerbose: jest.fn(),
  getLogger: jest.fn().mockReturnValue({
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    customLog: jest.fn(),
    customError: jest.fn(),
    customWarn: jest.fn(),
    customDebug: jest.fn(),
    customVerbose: jest.fn(),
  }),
};

/**
 * Mock for ConfigService
 */
export const mockConfigService = {
  get: jest.fn(),
  getOrThrow: jest.fn(),
  isProduction: jest.fn().mockReturnValue(false),
  isDevelopment: jest.fn().mockReturnValue(true),
  isTest: jest.fn().mockReturnValue(false),
};

/**
 * Mock for CacheService
 */
export const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  getOrSet: jest.fn(),
  getWithTtl: jest.fn(),
  setWithTtl: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
};

/**
 * Mock for MetricsService
 */
export const mockMetricsService = {
  recordHttpRequestStart: jest.fn(),
  recordHttpRequestEnd: jest.fn(),
  recordLlmRequest: jest.fn(),
  recordLlmCacheHit: jest.fn(),
  recordLlmCacheMiss: jest.fn(),
  recordAgentExecution: jest.fn(),
  getMetrics: jest.fn(),
  resetMetrics: jest.fn(),
  httpRequestsTotal: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
  httpRequestsInProgress: { inc: jest.fn(), dec: jest.fn() },
  llmRequestsTotal: { inc: jest.fn() },
  llmRequestDuration: { observe: jest.fn() },
  llmTokensUsed: { inc: jest.fn() },
  llmCacheHits: { inc: jest.fn() },
  llmCacheMisses: { inc: jest.fn() },
  agentExecutionsTotal: { inc: jest.fn() },
  agentExecutionDuration: { observe: jest.fn() },
  agentExecutionSteps: { observe: jest.fn() },
  memoryUsage: { set: jest.fn() },
  cpuUsage: { set: jest.fn() },
};

/**
 * Mock for CircuitBreakerService
 */
export const mockCircuitBreakerService = {
  registerCircuit: jest.fn(),
  execute: jest.fn(),
  getCircuitState: jest.fn(),
  resetCircuit: jest.fn(),
  getAllCircuits: jest.fn(),
  getCircuit: jest.fn(),
};
