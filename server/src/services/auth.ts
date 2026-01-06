/**
 * @fileoverview Authentication service for user registration, login, and session management.
 *
 * This service handles:
 * - User registration with password hashing
 * - User login with credential validation
 * - JWT token generation and management
 * - User profile retrieval
 *
 * Security features:
 * - Passwords are hashed using bcrypt with salt rounds of 10
 * - JWT tokens are signed with a configurable secret
 * - Sensitive data (passwords) is never returned in responses
 *
 * @module services/auth
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { config } from '../config/index.js'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'

const logger = createLogger('auth-service')

/** Number of salt rounds for bcrypt password hashing */
const SALT_ROUNDS = 10

/**
 * Input data required for user registration.
 *
 * @interface RegisterInput
 * @property {string} email - User's email address (must be unique)
 * @property {string} name - User's display name
 * @property {string} password - Plain text password (will be hashed)
 */
export interface RegisterInput {
  email: string
  name: string
  password: string
}

/**
 * Input data required for user login.
 *
 * @interface LoginInput
 * @property {string} email - User's email address
 * @property {string} password - Plain text password to verify
 */
export interface LoginInput {
  email: string
  password: string
}

/**
 * Safe user data returned from auth operations (excludes password).
 *
 * @interface SafeUser
 * @property {string} id - Unique user identifier
 * @property {string} email - User's email address
 * @property {string} name - User's display name
 * @property {Date} createdAt - Account creation timestamp
 */
export interface SafeUser {
  id: string
  email: string
  name: string
  createdAt: Date
}

/**
 * Authentication response containing user data and JWT token.
 *
 * @interface AuthResponse
 * @property {SafeUser} user - User profile data (password excluded)
 * @property {string} token - JWT authentication token
 */
export interface AuthResponse {
  user: SafeUser
  token: string
}

/**
 * Authentication service providing user registration, login, and profile management.
 *
 * @example
 * // Register a new user
 * const { user, token } = await authService.register({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   password: 'securePassword123'
 * });
 *
 * @example
 * // Login an existing user
 * const { user, token } = await authService.login({
 *   email: 'user@example.com',
 *   password: 'securePassword123'
 * });
 */
export const authService = {
  /**
   * Registers a new user account.
   *
   * Process:
   * 1. Check if email is already registered
   * 2. Hash the password using bcrypt
   * 3. Create user record in database
   * 4. Generate JWT token for immediate authentication
   *
   * @param {RegisterInput} input - Registration data
   * @param {string} input.email - Email address (must be unique)
   * @param {string} input.name - Display name
   * @param {string} input.password - Plain text password
   *
   * @returns {Promise<AuthResponse>} User data and authentication token
   *
   * @throws {AppError} 409 - If email is already registered
   * @throws {Error} Database errors are propagated
   *
   * @example
   * try {
   *   const { user, token } = await authService.register({
   *     email: 'newuser@example.com',
   *     name: 'Jane Smith',
   *     password: 'MySecurePass123!'
   *   });
   *   console.log(`Welcome ${user.name}!`);
   * } catch (error) {
   *   if (error.code === 'CONFLICT') {
   *     console.log('Email already registered');
   *   }
   * }
   */
  async register({ email, name, password }: RegisterInput): Promise<AuthResponse> {
    logger.info('Registration attempt', { email })

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      logger.warn('Registration failed - email exists', { email })
      throw AppError.conflict('Email already registered')
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    // Generate authentication token
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    })

    logger.info('User registered successfully', { userId: user.id, email })
    return { user, token }
  },

  /**
   * Authenticates a user with email and password.
   *
   * Process:
   * 1. Find user by email
   * 2. Verify password against stored hash
   * 3. Generate new JWT token
   *
   * @param {LoginInput} input - Login credentials
   * @param {string} input.email - User's email address
   * @param {string} input.password - Plain text password
   *
   * @returns {Promise<AuthResponse>} User data and authentication token
   *
   * @throws {AppError} 401 - If credentials are invalid (user not found or wrong password)
   *
   * @security
   * - Uses the same error message for both "user not found" and "wrong password"
   *   to prevent email enumeration attacks
   * - Passwords are compared using timing-safe bcrypt.compare()
   *
   * @example
   * const { user, token } = await authService.login({
   *   email: 'user@example.com',
   *   password: 'userPassword'
   * });
   * // Store token for subsequent API requests
   * localStorage.setItem('authToken', token);
   */
  async login({ email, password }: LoginInput): Promise<AuthResponse> {
    logger.info('Login attempt', { email })

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      logger.warn('Login failed - user not found', { email })
      throw AppError.unauthorized('Invalid credentials')
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      logger.warn('Login failed - invalid password', { email, userId: user.id })
      throw AppError.unauthorized('Invalid credentials')
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    })

    logger.info('User logged in successfully', { userId: user.id, email })
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    }
  },

  /**
   * Retrieves a user's profile by their ID.
   *
   * Used for:
   * - Fetching current user data after token verification
   * - Refreshing user profile information
   *
   * @param {string} userId - The unique identifier of the user
   *
   * @returns {Promise<SafeUser | null>} User data or null if not found
   *
   * @example
   * const user = await authService.getUser(req.userId);
   * if (!user) {
   *   throw AppError.notFound('User', req.userId);
   * }
   */
  async getUser(userId: string): Promise<SafeUser | null> {
    logger.debug('Fetching user', { userId })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })
    return user
  },
}
