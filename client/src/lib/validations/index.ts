/**
 * @fileoverview Validation Schemas
 *
 * Centralized Zod schemas for form validation across the application.
 * These schemas provide runtime type checking and form validation.
 *
 * @module lib/validations
 */

import { z } from 'zod'

// ===========================================
// Common Schemas
// ===========================================

/**
 * Non-empty string with trimming
 */
export const requiredString = z.string().min(1, 'This field is required').trim()

/**
 * Optional string that transforms empty strings to undefined
 */
export const optionalString = z.string().trim().optional().transform(val => val || undefined)

/**
 * Positive number validation
 */
export const positiveNumber = z.number().positive('Must be a positive number')

/**
 * Currency amount (positive, max 2 decimal places)
 */
export const currencyAmount = z
  .number()
  .positive('Amount must be greater than 0')
  .multipleOf(0.01, 'Amount can only have 2 decimal places')

/**
 * Date string in ISO format
 */
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')

/**
 * Optional date string
 */
export const optionalDateString = z.string().optional().transform(val => val || undefined)

// ===========================================
// Transaction Schemas
// ===========================================

export const transactionTypeEnum = z.enum(['INCOME', 'EXPENSE'])

export const transactionSchema = z.object({
  description: requiredString.max(200, 'Description too long'),
  amount: currencyAmount,
  type: transactionTypeEnum,
  date: dateString,
  categoryId: optionalString,
  budgetId: optionalString,
  notes: optionalString.pipe(z.string().max(500, 'Notes too long').optional()),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

// ===========================================
// Budget Schemas
// ===========================================

export const budgetSchema = z.object({
  name: requiredString.max(100, 'Name too long'),
  amount: currencyAmount,
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
})

export type BudgetFormData = z.infer<typeof budgetSchema>

// ===========================================
// Category Schemas
// ===========================================

export const categorySchema = z.object({
  name: requiredString.max(50, 'Name too long'),
  type: transactionTypeEnum,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// ===========================================
// Savings Goal Schemas
// ===========================================

export const goalTypeEnum = z.enum(['GENERAL', 'BABY', 'HOUSE'])

export const savingsGoalSchema = z.object({
  name: requiredString.max(100, 'Name too long'),
  targetAmount: currencyAmount,
  currentAmount: z.number().min(0, 'Amount cannot be negative').default(0),
  targetDate: optionalDateString,
  type: goalTypeEnum.default('GENERAL'),
  notes: optionalString,
})

export type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>

// ===========================================
// Life Goal Schemas
// ===========================================

export const lifeGoalCategoryEnum = z.enum([
  'CAREER',
  'PERSONAL',
  'TRAVEL',
  'LEARNING',
  'RELATIONSHIPS',
  'HEALTH',
  'CREATIVE',
  'ADVENTURE',
  'OTHER',
])

export const lifeGoalStatusEnum = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'ON_HOLD',
  'ABANDONED',
])

export const lifeGoalSchema = z.object({
  title: requiredString.max(200, 'Title too long'),
  description: optionalString.pipe(z.string().max(1000, 'Description too long').optional()),
  category: lifeGoalCategoryEnum,
  status: lifeGoalStatusEnum.optional(),
  targetDate: optionalDateString,
  priority: z.number().min(1).max(3).optional(),
  notes: optionalString,
})

export type LifeGoalFormData = z.infer<typeof lifeGoalSchema>

export const milestoneSchema = z.object({
  title: requiredString.max(200, 'Title too long'),
  description: optionalString,
  targetDate: optionalDateString,
})

export type MilestoneFormData = z.infer<typeof milestoneSchema>

// ===========================================
// Recurring Transaction Schemas
// ===========================================

export const frequencyEnum = z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'])

export const recurringTransactionSchema = z.object({
  description: requiredString.max(200, 'Description too long'),
  amount: currencyAmount,
  type: transactionTypeEnum,
  frequency: frequencyEnum,
  startDate: dateString,
  endDate: optionalDateString,
  categoryId: optionalString,
  budgetId: optionalString,
  notes: optionalString,
})

export type RecurringTransactionFormData = z.infer<typeof recurringTransactionSchema>

// ===========================================
// Auth Schemas
// ===========================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: requiredString.max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>
