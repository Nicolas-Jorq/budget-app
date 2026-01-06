/**
 * Auth Service Tests
 *
 * Tests for user registration, login, and JWT token management.
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { mockPrisma, resetPrismaMocks } from '../mocks/prisma'
import { createMockUser } from '../mocks/fixtures'

// Must import after mocks are set up
import { authService } from '../../services/auth'

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('AuthService', () => {
  beforeEach(() => {
    resetPrismaMocks()
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = createMockUser({
        id: 'new-user-id',
        email: 'new@example.com',
        name: 'New User',
      })

      // Mock: user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null)

      // Mock: bcrypt hash
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')

      // Mock: user creation (select returns without password)
      mockPrisma.user.create.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
      })

      const result = await authService.register({
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      })

      // Verify user was checked for existence
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      })

      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)

      // Verify user was created
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: 'New User',
          password: 'hashed-password',
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })

      // Verify response structure
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe('new@example.com')
      expect(result.user.name).toBe('New User')

      // Verify JWT token is valid
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as { userId: string }
      expect(decoded.userId).toBe(mockUser.id)
    })

    it('should throw error if email already exists', async () => {
      const existingUser = createMockUser()

      // Mock: user already exists
      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      await expect(
        authService.register({
          email: existingUser.email,
          name: 'Another User',
          password: 'password123',
        })
      ).rejects.toThrow('Email already registered')

      // Verify user creation was not attempted
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = createMockUser({
        password: 'hashed-password',
      })

      // Mock: user found
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Mock: password matches
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await authService.login({
        email: mockUser.email,
        password: 'correct-password',
      })

      // Verify user lookup
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      })

      // Verify password comparison
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed-password')

      // Verify response
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUser.email)

      // Verify password is not in response
      expect(result.user).not.toHaveProperty('password')
    })

    it('should throw error for non-existent user', async () => {
      // Mock: user not found
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid credentials')

      // Verify password was never compared
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('should throw error for invalid password', async () => {
      const mockUser = createMockUser()

      // Mock: user found
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Mock: password doesn't match
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        authService.login({
          email: mockUser.email,
          password: 'wrong-password',
        })
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('getUser', () => {
    it('should return user by ID', async () => {
      const mockUser = createMockUser()

      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
      })

      const result = await authService.getUser(mockUser.id)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
      })
    })

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await authService.getUser('non-existent-id')

      expect(result).toBeNull()
    })
  })
})
