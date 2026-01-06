/**
 * @fileoverview Centralized logging configuration for the Budget App.
 *
 * This module provides a Winston-based logger with:
 * - Environment-aware formatting (dev: human-readable, prod: JSON)
 * - Automatic timestamp injection
 * - Stack trace preservation for errors
 * - Module-specific child loggers for better traceability
 * - File-based logging in production
 *
 * @module lib/logger
 *
 * @example
 * // Create a module-specific logger
 * import { createLogger } from '../lib/logger.js';
 * const logger = createLogger('auth-service');
 *
 * // Use the logger
 * logger.info('User logged in', { userId: 'abc123' });
 * logger.error('Authentication failed', { email: 'user@example.com' });
 */

import winston from 'winston'
import { config } from '../config/index.js'

const { combine, timestamp, printf, colorize, json, errors } = winston.format

/**
 * Custom format for development environment.
 * Produces human-readable output with colors and inline metadata.
 *
 * @example
 * Output: "14:30:25 [info]: User logged in {"userId":"abc123","module":"auth-service"}"
 */
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`
  }
  return msg
})

/**
 * Main Winston logger instance.
 *
 * Configuration varies by environment:
 * - Development: Debug level, colorized console output
 * - Production: Info level, JSON format, file logging enabled
 */
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'budget-app' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.nodeEnv === 'production'
        ? combine(timestamp(), json())
        : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat),
    }),
    // File transport for errors (production)
    ...(config.nodeEnv === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(timestamp(), json()),
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: combine(timestamp(), json()),
          }),
        ]
      : []),
  ],
})

/**
 * Creates a child logger for a specific module.
 *
 * Child loggers inherit the parent configuration but add
 * module-specific metadata to every log entry. This makes
 * it easier to filter and trace logs by component.
 *
 * @param module - The name of the module (e.g., 'auth-service', 'budget-controller')
 * @returns A Winston child logger instance
 *
 * @example
 * // In a service file
 * const logger = createLogger('transaction-service');
 *
 * // Logs will include: {"module":"transaction-service", ...}
 * logger.info('Transaction created', { transactionId: 'xyz' });
 *
 * @example
 * // Standard log levels
 * logger.error('Critical failure', { error: err.message });  // Errors, exceptions
 * logger.warn('Deprecated endpoint used', { path: '/old' }); // Warnings
 * logger.info('Request processed', { duration: '45ms' });    // General info
 * logger.debug('Query params', { params: req.query });       // Debug details
 */
export const createLogger = (module: string): winston.Logger => {
  return logger.child({ module })
}

/**
 * Default logger instance for general application logging.
 *
 * Prefer using createLogger() with a module name for better traceability.
 * Use this default logger only for application-level events.
 *
 * @example
 * import logger from '../lib/logger.js';
 * logger.info('Application started', { port: 3001 });
 */
export default logger
