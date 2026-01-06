/**
 * Prisma Client Mock for Testing
 *
 * Provides a fully mocked Prisma client with chainable methods.
 * Each model has mocked CRUD operations that can be configured per test.
 */

type MockPrismaModel = {
  findMany: jest.Mock
  findFirst: jest.Mock
  findUnique: jest.Mock
  create: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  deleteMany: jest.Mock
  count: jest.Mock
  aggregate: jest.Mock
}

function createMockModel(): MockPrismaModel {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  }
}

interface MockPrismaClient {
  user: MockPrismaModel
  budget: MockPrismaModel
  transaction: MockPrismaModel
  savingsGoal: MockPrismaModel
  contribution: MockPrismaModel
  babyMilestone: MockPrismaModel
  houseGoal: MockPrismaModel
  propertySnapshot: MockPrismaModel
  bankAccount: MockPrismaModel
  bankDocument: MockPrismaModel
  pendingTransaction: MockPrismaModel
  $transaction: jest.Mock
  $connect: jest.Mock
  $disconnect: jest.Mock
}

export const mockPrisma: MockPrismaClient = {
  user: createMockModel(),
  budget: createMockModel(),
  transaction: createMockModel(),
  savingsGoal: createMockModel(),
  contribution: createMockModel(),
  babyMilestone: createMockModel(),
  houseGoal: createMockModel(),
  propertySnapshot: createMockModel(),
  bankAccount: createMockModel(),
  bankDocument: createMockModel(),
  pendingTransaction: createMockModel(),
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
}

// Set up $transaction to use mockPrisma after it's defined
mockPrisma.$transaction.mockImplementation((callback: (prisma: MockPrismaClient) => Promise<unknown>) => callback(mockPrisma))

/**
 * Reset all mocks between tests
 */
export function resetPrismaMocks(): void {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset()
        }
      })
    }
  })
}

// Mock the prisma module
jest.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}))
