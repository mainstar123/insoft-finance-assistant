/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  /**
   * Redis URL for caching and message broker
   */
  redisUrl: string;

  /**
   * Weaviate URL for vector database
   */
  weaviateUrl: string;

  /**
   * PostgreSQL database URL
   */
  databaseUrl: string;
}
