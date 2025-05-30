/**
 * Utility functions for error handling
 */

/**
 * Ensures an error is an Error object
 * @param error The error to normalize
 * @returns An Error object
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

/**
 * Gets a safe error message from any error object
 * @param error The error to get the message from
 * @returns A string message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Creates a standardized error logger message
 * @param context The context where the error occurred
 * @param error The error object
 * @returns Formatted error message
 */
export function createErrorLogMessage(context: string, error: unknown): string {
  return `Error in ${context}: ${getErrorMessage(error)}`;
}

/**
 * Type guard to check if an object is an Error
 * @param error The object to check
 * @returns True if the object is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
