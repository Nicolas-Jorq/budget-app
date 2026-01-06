/**
 * @fileoverview Global error handling middleware for Express.
 *
 * This middleware:
 * - Catches all errors thrown in route handlers
 * - Converts errors to appropriate HTTP responses
 * - Logs errors with context for debugging
 * - Sanitizes error messages in production
 *
 * @module middleware/errorHandler
 */

import { Request, Response, NextFunction } from 'express'
import { AppError, isAppError, isPrismaError, HttpStatus, ErrorCode } from '../utils/errors.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('error-handler')

/**
 * Error response structure sent to clients.
 */
interface ErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: Record<string, unknown>
  }
}

/**
 * Maps Prisma error codes to user-friendly messages and HTTP status codes.
 */
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string; code: string }> = {
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'A record with this value already exists',
    code: ErrorCode.ALREADY_EXISTS,
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    message: 'Record not found',
    code: ErrorCode.NOT_FOUND,
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Invalid reference - related record does not exist',
    code: ErrorCode.VALIDATION_ERROR,
  },
  P2014: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Invalid data provided',
    code: ErrorCode.VALIDATION_ERROR,
  },
}

/**
 * Handles Prisma database errors and converts them to AppError instances.
 *
 * @param error - The Prisma error object
 * @returns AppError with appropriate status and message
 */
function handlePrismaError(error: Error & { code: string }): AppError {
  const mapping = PRISMA_ERROR_MAP[error.code]

  if (mapping) {
    return new AppError(mapping.message, mapping.status, mapping.code as any, {
      prismaCode: error.code,
    })
  }

  // Unknown Prisma error - log it and return generic message
  logger.error('Unknown Prisma error', {
    code: error.code,
    message: error.message,
  })

  return AppError.internal('Database error occurred')
}

/**
 * Formats an error into a consistent response structure.
 *
 * @param error - The error to format
 * @param isDevelopment - Whether we're in development mode
 * @returns Formatted error response
 */
function formatErrorResponse(error: AppError, isDevelopment: boolean): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
    },
  }

  // Include details only in development
  if (isDevelopment && error.details) {
    response.error.details = error.details
  }

  return response
}

/**
 * Global error handling middleware.
 *
 * This middleware should be registered LAST in the Express middleware chain.
 * It catches all errors and converts them to appropriate HTTP responses.
 *
 * @param err - The error object
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (required for error middleware signature)
 *
 * @example
 * // Register as last middleware
 * app.use(errorHandler);
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV !== 'production'

  // Convert error to AppError if it isn't already
  let appError: AppError

  if (isAppError(err)) {
    appError = err
  } else if (isPrismaError(err)) {
    appError = handlePrismaError(err)
  } else if (err.name === 'JsonWebTokenError') {
    appError = new AppError('Invalid token', HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_TOKEN)
  } else if (err.name === 'TokenExpiredError') {
    appError = new AppError('Token expired', HttpStatus.UNAUTHORIZED, ErrorCode.TOKEN_EXPIRED)
  } else {
    // Unknown error - wrap it
    appError = AppError.internal(
      isDevelopment ? err.message : 'An unexpected error occurred'
    )
  }

  // Log the error with context
  const logContext = {
    errorCode: appError.code,
    statusCode: appError.statusCode,
    path: req.path,
    method: req.method,
    userId: (req as any).userId,
    details: appError.details,
    ...(isDevelopment && { stack: err.stack }),
  }

  // Log at appropriate level based on status code
  if (appError.statusCode >= 500) {
    logger.error(appError.message, logContext)
  } else if (appError.statusCode >= 400) {
    logger.warn(appError.message, logContext)
  }

  // Send response
  const response = formatErrorResponse(appError, isDevelopment)
  res.status(appError.statusCode).json(response)
}

/**
 * 404 Not Found handler for undefined routes.
 *
 * Register this AFTER all route definitions but BEFORE the error handler.
 *
 * @param req - Express request object
 * @param _res - Express response object
 * @param next - Express next function
 *
 * @example
 * app.use('/api', routes);
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound('Route', `${req.method} ${req.path}`))
}
