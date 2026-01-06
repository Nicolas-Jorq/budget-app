/**
 * @fileoverview Categories Service
 *
 * Manages user-configurable transaction and budget categories.
 * Categories can be of type EXPENSE, INCOME, or BOTH.
 * Each user gets default categories seeded on first access.
 *
 * @module services/categories
 */

import { PrismaClient, CategoryType } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Default expense categories with colors for new users.
 */
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', color: '#ef4444', sortOrder: 1 },
  { name: 'Transportation', color: '#f97316', sortOrder: 2 },
  { name: 'Shopping', color: '#eab308', sortOrder: 3 },
  { name: 'Entertainment', color: '#22c55e', sortOrder: 4 },
  { name: 'Bills & Utilities', color: '#06b6d4', sortOrder: 5 },
  { name: 'Health', color: '#3b82f6', sortOrder: 6 },
  { name: 'Travel', color: '#8b5cf6', sortOrder: 7 },
  { name: 'Education', color: '#ec4899', sortOrder: 8 },
  { name: 'Other', color: '#6b7280', sortOrder: 99 },
]

/**
 * Default income categories with colors for new users.
 */
const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', color: '#10b981', sortOrder: 1 },
  { name: 'Freelance', color: '#14b8a6', sortOrder: 2 },
  { name: 'Investment', color: '#6366f1', sortOrder: 3 },
  { name: 'Rental Income', color: '#8b5cf6', sortOrder: 4 },
  { name: 'Side Hustle', color: '#f59e0b', sortOrder: 5 },
  { name: 'Bonus', color: '#22c55e', sortOrder: 6 },
  { name: 'Gift', color: '#ec4899', sortOrder: 7 },
  { name: 'Refund', color: '#06b6d4', sortOrder: 8 },
  { name: 'Other Income', color: '#6b7280', sortOrder: 99 },
]

/**
 * Seed default categories for a user if they don't have any.
 */
async function seedDefaultCategories(userId: string): Promise<void> {
  const existingCount = await prisma.category.count({ where: { userId } })

  if (existingCount > 0) {
    return // User already has categories
  }

  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    userId,
    type: 'EXPENSE' as CategoryType,
    isDefault: true,
  }))

  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((cat) => ({
    ...cat,
    userId,
    type: 'INCOME' as CategoryType,
    isDefault: true,
  }))

  await prisma.category.createMany({
    data: [...expenseCategories, ...incomeCategories],
  })
}

export const categoriesService = {
  /**
   * Get all categories for a user, seeding defaults if needed.
   */
  async getAll(userId: string) {
    await seedDefaultCategories(userId)

    return prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    })
  },

  /**
   * Get categories by type (expense, income, or both).
   */
  async getByType(userId: string, type: 'expense' | 'income') {
    await seedDefaultCategories(userId)

    const categoryType = type === 'expense' ? 'EXPENSE' : 'INCOME'

    return prisma.category.findMany({
      where: {
        userId,
        OR: [{ type: categoryType }, { type: 'BOTH' }],
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  },

  /**
   * Get a single category by ID.
   */
  async getById(userId: string, id: string) {
    return prisma.category.findFirst({
      where: { id, userId },
    })
  },

  /**
   * Create a new category.
   */
  async create(
    userId: string,
    data: {
      name: string
      type: 'EXPENSE' | 'INCOME' | 'BOTH'
      color?: string
      icon?: string
      sortOrder?: number
    }
  ) {
    // Check for duplicate name
    const existing = await prisma.category.findFirst({
      where: { userId, name: data.name },
    })

    if (existing) {
      throw new Error(`Category "${data.name}" already exists`)
    }

    return prisma.category.create({
      data: {
        ...data,
        userId,
        isDefault: false,
      },
    })
  },

  /**
   * Update an existing category.
   */
  async update(
    userId: string,
    id: string,
    data: {
      name?: string
      type?: 'EXPENSE' | 'INCOME' | 'BOTH'
      color?: string
      icon?: string
      sortOrder?: number
    }
  ) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findFirst({
        where: { userId, name: data.name },
      })

      if (existing) {
        throw new Error(`Category "${data.name}" already exists`)
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    })
  },

  /**
   * Delete a category.
   * Note: This doesn't delete transactions with this category,
   * they keep the category name as a string.
   */
  async delete(userId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    return prisma.category.delete({
      where: { id },
    })
  },

  /**
   * Reset categories to defaults for a user.
   * Deletes all custom categories and recreates defaults.
   */
  async resetToDefaults(userId: string) {
    await prisma.category.deleteMany({ where: { userId } })
    await seedDefaultCategories(userId)

    return prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    })
  },

  /**
   * Update sort order for multiple categories at once.
   */
  async updateSortOrder(userId: string, updates: { id: string; sortOrder: number }[]) {
    const updatePromises = updates.map(({ id, sortOrder }) =>
      prisma.category.updateMany({
        where: { id, userId },
        data: { sortOrder },
      })
    )

    await Promise.all(updatePromises)

    return prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    })
  },
}
