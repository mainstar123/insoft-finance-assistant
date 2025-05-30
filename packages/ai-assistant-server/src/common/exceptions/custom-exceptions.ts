import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all custom exceptions
 */
export class BaseException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    public readonly code?: string,
    public readonly details?: any,
  ) {
    super(
      {
        message,
        error: code || 'Error',
        details,
      },
      status,
    );
  }
}

/**
 * Exception for validation errors
 */
export class ValidationException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}

/**
 * Exception for not found resources
 */
export class NotFoundException extends BaseException {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;

    super(message, HttpStatus.NOT_FOUND, 'RESOURCE_NOT_FOUND', {
      resource,
      id,
    });
  }
}

/**
 * Exception for unauthorized access
 */
export class UnauthorizedException extends BaseException {
  constructor(message: string = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

/**
 * Exception for forbidden access
 */
export class ForbiddenException extends BaseException {
  constructor(message: string = 'Forbidden access') {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

/**
 * Exception for service unavailability
 */
export class ServiceUnavailableException extends BaseException {
  constructor(service: string, details?: any) {
    super(
      `Service ${service} is currently unavailable`,
      HttpStatus.SERVICE_UNAVAILABLE,
      'SERVICE_UNAVAILABLE',
      details,
    );
  }
}

/**
 * Exception for external service errors
 */
export class ExternalServiceException extends BaseException {
  constructor(service: string, message: string, details?: any) {
    super(
      `Error from external service ${service}: ${message}`,
      HttpStatus.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR',
      details,
    );
  }
}

/**
 * Exception for rate limiting
 */
export class RateLimitException extends BaseException {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED',
      details,
    );
  }
}

/**
 * Exception for LLM-related errors
 */
export class LLMException extends BaseException {
  constructor(message: string, details?: any) {
    super(
      `LLM error: ${message}`,
      HttpStatus.SERVICE_UNAVAILABLE,
      'LLM_ERROR',
      details,
    );
  }
}

/**
 * Exception for agent-related errors
 */
export class AgentException extends BaseException {
  constructor(agent: string, message: string, details?: any) {
    super(
      `Agent ${agent} error: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'AGENT_ERROR',
      details,
    );
  }
}

/**
 * Exception for persistence errors
 */
export class PersistenceException extends BaseException {
  constructor(operation: string, resource: string, details?: any) {
    super(
      `Failed to ${operation} ${resource}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'PERSISTENCE_ERROR',
      details,
    );
  }
}

/**
 * Exception for tool execution errors
 */
export class ToolExecutionException extends BaseException {
  constructor(tool: string, message: string, details?: any) {
    super(
      `Tool ${tool} execution error: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'TOOL_EXECUTION_ERROR',
      details,
    );
  }
}

/**
 * Exception for conversation context errors
 */
export class ConversationContextException extends BaseException {
  constructor(message: string, details?: any) {
    super(
      `Conversation context error: ${message}`,
      HttpStatus.BAD_REQUEST,
      'CONVERSATION_CONTEXT_ERROR',
      details,
    );
  }
}
