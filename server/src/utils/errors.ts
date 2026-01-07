/**
 * @fileoverview Centralized error handling utilities for the Budget App API.
 *
 * This module provides:
 * - Custom error classes for different error types
 * - Error factory functions for common scenarios
 * - Type guards for error identification
 *
 * @module utils/errors
 * @example
 * // Throwing a not found error
 * throw AppError.notFound('Budget', budgetId);
 *
 * // Throwing a validation error
 * throw AppError.validation('Email is required');
 *
 * // Throwing an unauthorized error
 * throw AppError.unauthorized('Invalid credentials');
 */

/**
 * HTTP status codes used throughout the application.
 * Using constants ensures consistency and prevents magic numbers.
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus]

/**
 * Error codes for categorizing errors in logs and responses.
 * These help with debugging and monitoring.
 */
export const ErrorCode = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Authorization errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

/**
 * Base application error class.
 * All custom errors should extend this class.
 *
 * @class AppError
 * @extends Error
 *
 * @property {number} statusCode - HTTP status code for the response
 * @property {string} code - Error code for categorization
 * @property {boolean} isOperational - Whether error is operational (expected) vs programmer error
 * @property {Record<string, unknown>} [details] - Additional error context
 *
 * @example
 * throw new AppError('Custom error message', 400, 'CUSTOM_ERROR');
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCodeType
  public readonly isOperational: boolean
  public readonly details?: Record<string, unknown>
  public readonly timestamp: Date

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCodeType = ErrorCode.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    this.details = details
    this.timestamp = new Date()

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Creates a validation error (400 Bad Request).
   *
   * @param message - Description of what validation failed
   * @param details - Additional context about the validation failure
   * @returns AppError instance
   *
   * @example
   * throw AppError.validation('Email format is invalid', { field: 'email' });
   */
  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, details)
  }

  /**
   * Creates an unauthorized error (401 Unauthorized).
   *
   * @param message - Description of the authentication failure
   * @returns AppError instance
   *
   * @example
   * throw AppError.unauthorized('Invalid credentials');
   */
  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
  }

  /**
   * Creates a forbidden error (403 Forbidden).
   *
   * @param message - Description of why access is denied
   * @returns AppError instance
   *
   * @example
   * throw AppError.forbidden('You do not have access to this resource');
   */
  static forbidden(message: string = 'Access denied'): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN)
  }

  /**
   * Creates a not found error (404 Not Found).
   *
   * @param resource - Name of the resource that wasn't found
   * @param identifier - ID or identifier that was searched for
   * @returns AppError instance
   *
   * @example
   * throw AppError.notFound('Budget', 'abc123');
   */
  static notFound(resource: string, identifier?: string): AppError {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`
    return new AppError(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, {
      resource,
      identifier,
    })
  }

  /**
   * Creates a conflict error (409 Conflict).
   *
   * @param message - Description of the conflict
   * @param details - Additional context
   * @returns AppError instance
   *
   * @example
   * throw AppError.conflict('Email already registered');
   */
  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT, details)
  }

  /**
   * Creates an external service error (503 Service Unavailable).
   *
   * @param service - Name of the external service that failed
   * @param details - Additional context about the failure
   * @returns AppError instance
   *
   * @example
   * throw AppError.externalService('AI Service', { endpoint: '/extract' });
   */
  static externalService(service: string, details?: Record<string, unknown>): AppError {
    return new AppError(
      `${service} is currently unavailable`,
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      { service, ...details }
    )
  }

  /**
   * Creates a service unavailable error (503 Service Unavailable).
   *
   * @param message - Description of the service failure
   * @returns AppError instance
   *
   * @example
   * throw AppError.serviceUnavailable('Property search failed. Please try again later.');
   */
  static serviceUnavailable(message: string): AppError {
    return new AppError(message, HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.EXTERNAL_SERVICE_ERROR)
  }

  /**
   * Creates an internal server error (500 Internal Server Error).
   *
   * @param message - Error description (will be sanitized in production)
   * @param details - Additional context (only logged, not sent to client)
   * @returns AppError instance
   */
  static internal(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, details)
  }

  /**
   * Converts the error to a JSON-safe object for API responses.
   * Sensitive details are excluded in production.
   */
  toJSON(): Record<string, unknown> {
    const response: Record<string, unknown> = {
      success: false,
      error: {
        message: this.message,
        code: this.code,
      },
    }

    // Include details only in development
    if (process.env.NODE_ENV !== 'production' && this.details) {
      ;(response.error as Record<string, unknown>).details = this.details
    }

    return response
  }
}

/**
 * Type guard to check if an error is an AppError.
 *
 * @param error - The error to check
 * @returns True if the error is an AppError instance
 *
 * @example
 * if (isAppError(error)) {
 *   res.status(error.statusCode).json(error.toJSON());
 * }
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Type guard to check if an error is a Prisma known error.
 *
 * @param error - The error to check
 * @returns True if the error is a Prisma error with a code
 */
export function isPrismaError(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error && typeof (error as { code: unknown }).code === 'string'
}

/**
 * Wraps an async function to automatically catch errors.
 * Use this for route handlers to avoid try-catch boilerplate.
 *
 * @param fn - The async function to wrap
 * @returns Wrapped function that catches errors
 *
 * @example
 * router.get('/budgets', asyncHandler(async (req, res) => {
 *   const budgets = await budgetService.getAll(req.userId);
 *   res.json(budgets);
 * }));
 */
export function asyncHandler<T>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Import types for asyncHandler
import { Response, NextFunction } from 'express'
