/**
 * Budget Service Tests
 *
 * Tests for budget CRUD operations.
 */

import { Decimal } from '@prisma/client/runtime/library'
import { mockPrisma, resetPrismaMocks } from '../mocks/prisma'
import { createMockBudget } from '../mocks/fixtures'

// Must import after mocks are set up
import { budgetService } from '../../services/budgets'

describe('BudgetService', () => {
  const userId = 'user-test-123'

  beforeEach(() => {
    resetPrismaMocks()
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('should return all budgets for a user', async () => {
      const mockBudgets = [
        createMockBudget({ id: 'budget-1', name: 'Groceries' }),
        createMockBudget({ id: 'budget-2', name: 'Entertainment' }),
      ]

      mockPrisma.budget.findMany.mockResolvedValue(mockBudgets)

      const result = await budgetService.getAll(userId)

      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Groceries')
      expect(result[1].name).toBe('Entertainment')
    })

    it('should return empty array if no budgets exist', async () => {
      mockPrisma.budget.findMany.mockResolvedValue([])

      const result = await budgetService.getAll(userId)

      expect(result).toEqual([])
    })
  })

  describe('getById', () => {
    it('should return budget by ID', async () => {
      const mockBudget = createMockBudget()

      mockPrisma.budget.findFirst.mockResolvedValue(mockBudget)

      const result = await budgetService.getById(mockBudget.id, userId)

      expect(mockPrisma.budget.findFirst).toHaveBeenCalledWith({
        where: { id: mockBudget.id, userId },
      })

      expect(result).toEqual(mockBudget)
    })

    it('should return null if budget not found', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null)

      const result = await budgetService.getById('non-existent', userId)

      expect(result).toBeNull()
    })

    it('should return null if budget belongs to different user', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null)

      const result = await budgetService.getById('budget-1', 'different-user')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new budget', async () => {
      const newBudget = createMockBudget({
        id: 'new-budget-id',
        name: 'New Budget',
        amount: new Decimal(1000),
        category: 'Shopping',
      })

      mockPrisma.budget.create.mockResolvedValue(newBudget)

      const result = await budgetService.create(userId, {
        name: 'New Budget',
        amount: 1000,
        category: 'Shopping',
      })

      expect(mockPrisma.budget.create).toHaveBeenCalledWith({
        data: {
          name: 'New Budget',
          amount: 1000,
          category: 'Shopping',
          userId,
        },
      })

      expect(result.name).toBe('New Budget')
      expect(result.category).toBe('Shopping')
    })
  })

  describe('update', () => {
    it('should update an existing budget', async () => {
      const existingBudget = createMockBudget()
      const updatedBudget = createMockBudget({
        ...existingBudget,
        name: 'Updated Budget',
        amount: new Decimal(750),
      })

      mockPrisma.budget.findFirst.mockResolvedValue(existingBudget)
      mockPrisma.budget.update.mockResolvedValue(updatedBudget)

      const result = await budgetService.update(existingBudget.id, userId, {
        name: 'Updated Budget',
        amount: 750,
      })

      expect(mockPrisma.budget.findFirst).toHaveBeenCalledWith({
        where: { id: existingBudget.id, userId },
      })

      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: existingBudget.id },
        data: {
          name: 'Updated Budget',
          amount: 750,
        },
      })

      expect(result.name).toBe('Updated Budget')
    })

    it('should throw error if budget not found', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null)

      await expect(
        budgetService.update('non-existent', userId, { name: 'Test' })
      ).rejects.toThrow()

      expect(mockPrisma.budget.update).not.toHaveBeenCalled()
    })

    it('should allow partial updates', async () => {
      const existingBudget = createMockBudget()

      mockPrisma.budget.findFirst.mockResolvedValue(existingBudget)
      mockPrisma.budget.update.mockResolvedValue({
        ...existingBudget,
        name: 'Only Name Changed',
      })

      await budgetService.update(existingBudget.id, userId, {
        name: 'Only Name Changed',
      })

      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: existingBudget.id },
        data: { name: 'Only Name Changed' },
      })
    })
  })

  describe('delete', () => {
    it('should delete an existing budget', async () => {
      const existingBudget = createMockBudget()

      mockPrisma.budget.findFirst.mockResolvedValue(existingBudget)
      mockPrisma.budget.delete.mockResolvedValue(existingBudget)

      const result = await budgetService.delete(existingBudget.id, userId)

      expect(mockPrisma.budget.findFirst).toHaveBeenCalledWith({
        where: { id: existingBudget.id, userId },
      })

      expect(mockPrisma.budget.delete).toHaveBeenCalledWith({
        where: { id: existingBudget.id },
      })

      expect(result).toEqual(existingBudget)
    })

    it('should throw error if budget not found', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null)

      await expect(
        budgetService.delete('non-existent', userId)
      ).rejects.toThrow()

      expect(mockPrisma.budget.delete).not.toHaveBeenCalled()
    })
  })
})
