/**
 * Test Fixtures and Factories
 *
 * Provides factory functions to create test data with sensible defaults.
 * All IDs use predictable patterns for easier testing.
 */

import { Decimal } from '@prisma/client/runtime/library'

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-test-123',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$10$hashedpassword', // bcrypt hash placeholder
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export interface MockUser {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Create a mock budget for testing
 */
export function createMockBudget(overrides: Partial<MockBudget> = {}): MockBudget {
  return {
    id: 'budget-test-123',
    name: 'Test Budget',
    amount: new Decimal(500),
    spent: new Decimal(0),
    category: 'Groceries',
    userId: 'user-test-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export interface MockBudget {
  id: string
  name: string
  amount: Decimal
  spent: Decimal
  category: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Create a mock transaction for testing
 */
export function createMockTransaction(overrides: Partial<MockTransaction> = {}): MockTransaction {
  return {
    id: 'txn-test-123',
    description: 'Test Transaction',
    amount: new Decimal(50),
    type: 'expense',
    category: 'Groceries',
    date: new Date('2024-01-15'),
    budgetId: null,
    userId: 'user-test-123',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  }
}

export interface MockTransaction {
  id: string
  description: string
  amount: Decimal
  type: string
  category: string
  date: Date
  budgetId: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Create a mock savings goal for testing
 */
export function createMockGoal(overrides: Partial<MockGoal> = {}): MockGoal {
  return {
    id: 'goal-test-123',
    name: 'Test Goal',
    type: 'CUSTOM',
    targetAmount: new Decimal(10000),
    currentAmount: new Decimal(0),
    deadline: new Date('2025-12-31'),
    priority: 1,
    icon: null,
    color: null,
    metadata: null,
    isCompleted: false,
    userId: 'user-test-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export interface MockGoal {
  id: string
  name: string
  type: string
  targetAmount: Decimal
  currentAmount: Decimal
  deadline: Date | null
  priority: number
  icon: string | null
  color: string | null
  metadata: unknown
  isCompleted: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Create a mock contribution for testing
 */
export function createMockContribution(overrides: Partial<MockContribution> = {}): MockContribution {
  return {
    id: 'contrib-test-123',
    amount: new Decimal(100),
    note: null,
    goalId: 'goal-test-123',
    transactionId: null,
    createdAt: new Date('2024-01-15'),
    ...overrides,
  }
}

export interface MockContribution {
  id: string
  amount: Decimal
  note: string | null
  goalId: string
  transactionId: string | null
  createdAt: Date
}

/**
 * Generate a unique ID for testing
 */
let idCounter = 0
export function generateTestId(prefix: string = 'test'): string {
  idCounter++
  return `${prefix}-${idCounter}-${Date.now()}`
}

/**
 * Reset the ID counter between test suites
 */
export function resetIdCounter(): void {
  idCounter = 0
}
