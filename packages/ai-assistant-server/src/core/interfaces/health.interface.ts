export interface HealthCheck {
  status: 'ok' | 'error';
  database: 'connected' | 'disconnected';
  error?: string;
  timestamp: string;
}
