/**
 * AI configuration interface
 */
export interface AIConfig {
  /**
   * OpenAI API key
   */
  openaiApiKey: string;

  /**
   * Anthropic API key
   */
  anthropicApiKey: string;

  /**
   * Timeout for AI agents collaboration in milliseconds
   */
  agentsCollaborationTimeout: number;

  /**
   * Timeout for AI agents tools in milliseconds
   */
  agentsToolsTimeout: number;
}
