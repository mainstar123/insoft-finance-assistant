/**
 * Application configuration interface
 */
export interface AppConfig {
  /**
   * Frontend URL for CORS and redirects
   */
  frontendUrl: string;

  /**
   * Admin dashboard URL for CORS and redirects
   */
  adminDashboardUrl: string;

  /**
   * CORS origin pattern
   */
  corsOrigin: string;

  /**
   * Application URL
   */
  appUrl: string;

  /**
   * Node environment (development, production, test)
   */
  nodeEnv: 'development' | 'production' | 'test';

  /**
   * Port to run the server on
   */
  port: number;

  /**
   * Whether to enable AI debug mode
   */
  aiDebugMode: boolean;

  /**
   * JWT secret
   */
  jwtSecret: string;
}
