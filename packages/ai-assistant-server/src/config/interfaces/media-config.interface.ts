/**
 * Media configuration interface
 */
export interface MediaConfig {
  /**
   * Maximum file size in MB
   */
  maxFileSizeMb: number;

  /**
   * Path to store media files
   */
  mediaStoragePath: string;

  /**
   * Allowed file types (comma-separated)
   */
  allowedFileTypes: string[];
}
