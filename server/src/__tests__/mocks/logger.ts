/**
 * Logger Mock for Testing
 *
 * Silences all log output during tests.
 */

export const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

export const createLogger = jest.fn(() => mockLogger)

jest.mock('../../lib/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}))
