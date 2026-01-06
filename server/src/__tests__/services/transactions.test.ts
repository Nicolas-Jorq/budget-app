/**
 * Transaction Service Tests
 *
 * Tests for transaction CRUD operations and budget synchronization.
 */

import { Decimal } from '@prisma/client/runtime/library'
import { mockPrisma, resetPrismaMocks } from '../mocks/prisma'
import { createMockTransaction, createMockBudget } from '../mocks/fixtures'

// Must import after mocks are set up
import { transactionService } from '../../services/transactions'

describe('TransactionService', () => {
  const userId = 'user-test-123'

  beforeEach(() => {
    resetPrismaMocks()
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('should return all transactions for a user ordered by date', async () => {
      const mockTransactions = [
        createMockTransaction({ id: 'txn-1', date: new Date('2024-01-20') }),
        createMockTransaction({ id: 'txn-2', date: new Date('2024-01-15') }),
      ]

      mockPrisma.transaction.findMany.mockResolvedValue(
        mockTransactions.map(t => ({ ...t, budget: null }))
      )

      const result = await transactionService.getAll(userId)

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { date: 'desc' },
        include: { budget: true },
      })

      expect(result).toHaveLength(2)
    })
  })

  describe('getById', () => {
    it('should return transaction by ID with budget info', async () => {
      const mockTransaction = createMockTransaction()

      mockPrisma.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        budget: null,
      })

      const result = await transactionService.getById(mockTransaction.id, userId)

      expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: mockTransaction.id, userId },
        include: { budget: true },
      })

      expect(result?.id).toBe(mockTransaction.id)
    })

    it('should return null if transaction not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      const result = await transactionService.getById('non-existent', userId)

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create an expense transaction without budget', async () => {
      const newTransaction = createMockTransaction({
        id: 'new-txn',
        description: 'Coffee',
        amount: new Decimal(5),
        type: 'expense',
      })

      mockPrisma.transaction.create.mockResolvedValue(newTransaction)

      const result = await transactionService.create(userId, {
        description: 'Coffee',
        amount: 5,
        type: 'expense',
        category: 'Dining',
        date: '2024-01-15',
      })

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: {
          description: 'Coffee',
          amount: 5,
          type: 'expense',
          category: 'Dining',
          date: new Date('2024-01-15'),
          budgetId: undefined,
          userId,
        },
      })

      // Should not update any budget since none was linked
      expect(mockPrisma.budget.update).not.toHaveBeenCalled()

      expect(result.description).toBe('Coffee')
    })

    it('should create an expense and update linked budget spent amount', async () => {
      const budgetId = 'budget-123'
      const newTransaction = createMockTransaction({
        budgetId,
        amount: new Decimal(50),
        type: 'expense',
      })

      mockPrisma.transaction.create.mockResolvedValue(newTransaction)
      mockPrisma.budget.update.mockResolvedValue(createMockBudget())

      await transactionService.create(userId, {
        description: 'Groceries',
        amount: 50,
        type: 'expense',
        category: 'Groceries',
        date: '2024-01-15',
        budgetId,
      })

      // Should update budget spent amount
      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: budgetId },
        data: {
          spent: { increment: 50 },
        },
      })
    })

    it('should not update budget for income transactions', async () => {
      const budgetId = 'budget-123'
      const newTransaction = createMockTransaction({
        budgetId,
        amount: new Decimal(1000),
        type: 'income',
      })

      mockPrisma.transaction.create.mockResolvedValue(newTransaction)

      await transactionService.create(userId, {
        description: 'Salary',
        amount: 1000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-01',
        budgetId, // Even if budgetId is provided, income shouldn't update it
      })

      // Should NOT update budget for income
      expect(mockPrisma.budget.update).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update transaction and recalculate budget spent', async () => {
      const oldBudgetId = 'old-budget'
      const existingTransaction = createMockTransaction({
        budgetId: oldBudgetId,
        amount: new Decimal(50),
        type: 'expense',
      })

      mockPrisma.transaction.findFirst.mockResolvedValue(existingTransaction)
      mockPrisma.transaction.update.mockResolvedValue({
        ...existingTransaction,
        amount: new Decimal(75),
      })
      mockPrisma.budget.update.mockResolvedValue(createMockBudget())

      await transactionService.update(existingTransaction.id, userId, {
        amount: 75,
      })

      // Should decrement old amount from old budget
      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: oldBudgetId },
        data: {
          spent: { decrement: 50 },
        },
      })

      // Should increment new amount to same budget
      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: oldBudgetId },
        data: {
          spent: { increment: 75 },
        },
      })
    })

    it('should handle budget change (move transaction to different budget)', async () => {
      const oldBudgetId = 'old-budget'
      const newBudgetId = 'new-budget'
      const existingTransaction = createMockTransaction({
        budgetId: oldBudgetId,
        amount: new Decimal(100),
        type: 'expense',
      })

      mockPrisma.transaction.findFirst.mockResolvedValue(existingTransaction)
      mockPrisma.transaction.update.mockResolvedValue({
        ...existingTransaction,
        budgetId: newBudgetId,
      })
      mockPrisma.budget.update.mockResolvedValue(createMockBudget())

      await transactionService.update(existingTransaction.id, userId, {
        budgetId: newBudgetId,
      })

      // Should decrement from old budget
      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: oldBudgetId },
        data: {
          spent: { decrement: 100 },
        },
      })

      // Should increment to new budget
      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: newBudgetId },
        data: {
          spent: { increment: 100 },
        },
      })
    })

    it('should throw error if transaction not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      await expect(
        transactionService.update('non-existent', userId, { amount: 100 })
      ).rejects.toThrow()

      expect(mockPrisma.transaction.update).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete transaction and update budget spent', async () => {
      const budgetId = 'budget-123'
      const existingTransaction = createMockTransaction({
        budgetId,
        amount: new Decimal(75),
        type: 'expense',
      })

      mockPrisma.transaction.findFirst.mockResolvedValue(existingTransaction)
      mockPrisma.transaction.delete.mockResolvedValue(existingTransaction)
      mockPrisma.budget.update.mockResolvedValue(createMockBudget())

      const result = await transactionService.delete(existingTransaction.id, userId)

      // Should decrement budget spent
      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: budgetId },
        data: {
          spent: { decrement: 75 },
        },
      })

      expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: existingTransaction.id },
      })

      expect(result).toEqual(existingTransaction)
    })

    it('should delete transaction without budget (no budget update)', async () => {
      const existingTransaction = createMockTransaction({
        budgetId: null,
        type: 'expense',
      })

      mockPrisma.transaction.findFirst.mockResolvedValue(existingTransaction)
      mockPrisma.transaction.delete.mockResolvedValue(existingTransaction)

      await transactionService.delete(existingTransaction.id, userId)

      // Should NOT update any budget
      expect(mockPrisma.budget.update).not.toHaveBeenCalled()
    })

    it('should delete income transaction without affecting budget', async () => {
      const existingTransaction = createMockTransaction({
        budgetId: 'budget-123',
        type: 'income',
      })

      mockPrisma.transaction.findFirst.mockResolvedValue(existingTransaction)
      mockPrisma.transaction.delete.mockResolvedValue(existingTransaction)

      await transactionService.delete(existingTransaction.id, userId)

      // Should NOT update budget for income deletion
      expect(mockPrisma.budget.update).not.toHaveBeenCalled()
    })

    it('should throw error if transaction not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      await expect(
        transactionService.delete('non-existent', userId)
      ).rejects.toThrow()

      expect(mockPrisma.transaction.delete).not.toHaveBeenCalled()
    })
  })
})
