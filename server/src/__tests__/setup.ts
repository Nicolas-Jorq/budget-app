/**
 * Jest Test Setup
 *
 * This file runs before each test file and sets up:
 * - Environment variables for testing
 * - Global mocks (Prisma, Logger)
 * - Test utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
process.env.JWT_EXPIRES_IN = '1h'

// Mock the logger to silence output during tests
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

jest.mock('../lib/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}))

// Suppress console output during tests (comment out for debugging)
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'info').mockImplementation(() => {})
jest.spyOn(console, 'warn').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})

// Increase timeout for async operations
jest.setTimeout(10000)
