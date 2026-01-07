/**
 * @fileoverview Finance module Zod schemas.
 *
 * Contains validation schemas for:
 * - Budgets
 * - Transactions
 * - Categories
 * - Savings Goals
 * - Contributions
 * - Recurring Transactions
 *
 * @module schemas/finance
 */

import { z } from 'zod'
import {
  cuidSchema,
  nameSchema,
  notesSchema,
  positiveAmountSchema,
  nonNegativeAmountSchema,
  percentageSchema,
  dateStringSchema,
  hexColorSchema,
  iconSchema,
  paginationSchema,
} from './common.js'

// ============================================================================
// Budget Schemas
// ============================================================================

/**
 * Create budget request body
 */
export const createBudgetSchema = z.object({
  name: nameSchema,
  amount: positiveAmountSchema,
  category: z.string().trim().min(1, { message: 'Category is required' }),
})

/**
 * Update budget request body
 */
export const updateBudgetSchema = z.object({
  name: nameSchema.optional(),
  amount: positiveAmountSchema.optional(),
  category: z.string().trim().min(1).optional(),
  spent: nonNegativeAmountSchema.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// ============================================================================
// Transaction Schemas
// ============================================================================

/**
 * Transaction type enum
 */
export const transactionTypeSchema = z.enum(['income', 'expense'], {
  errorMap: () => ({ message: 'Type must be either "income" or "expense"' }),
})

/**
 * Create transaction request body
 */
export const createTransactionSchema = z.object({
  description: z.string().trim().min(1, { message: 'Description is required' }).max(500),
  amount: positiveAmountSchema,
  type: transactionTypeSchema,
  category: z.string().trim().min(1, { message: 'Category is required' }),
  date: dateStringSchema,
  budgetId: cuidSchema.optional().nullable(),
})

/**
 * Update transaction request body
 */
export const updateTransactionSchema = z.object({
  description: z.string().trim().min(1).max(500).optional(),
  amount: positiveAmountSchema.optional(),
  type: transactionTypeSchema.optional(),
  category: z.string().trim().min(1).optional(),
  date: dateStringSchema.optional(),
  budgetId: cuidSchema.optional().nullable(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

/**
 * Transaction list query params
 */
export const transactionListQuerySchema = paginationSchema.extend({
  type: transactionTypeSchema.optional(),
  category: z.string().optional(),
  budgetId: cuidSchema.optional(),
  search: z.string().max(100).optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  { message: 'startDate must be before or equal to endDate' }
)

// ============================================================================
// Category Schemas
// ============================================================================

/**
 * Category type enum
 */
export const categoryTypeSchema = z.enum(['EXPENSE', 'INCOME', 'BOTH'], {
  errorMap: () => ({ message: 'Type must be EXPENSE, INCOME, or BOTH' }),
})

/**
 * Create category request body
 */
export const createCategorySchema = z.object({
  name: nameSchema,
  type: categoryTypeSchema,
  color: hexColorSchema,
  icon: iconSchema,
})

/**
 * Update category request body
 */
export const updateCategorySchema = z.object({
  name: nameSchema.optional(),
  type: categoryTypeSchema.optional(),
  color: hexColorSchema.nullable(),
  icon: iconSchema.nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// ============================================================================
// Savings Goal Schemas
// ============================================================================

/**
 * Goal type enum
 */
export const goalTypeSchema = z.enum([
  'EMERGENCY_FUND',
  'BABY',
  'HOUSE',
  'VEHICLE',
  'VACATION',
  'EDUCATION',
  'RETIREMENT',
  'CUSTOM',
], {
  errorMap: () => ({ message: 'Invalid goal type' }),
})

/**
 * Create savings goal request body
 */
export const createGoalSchema = z.object({
  name: nameSchema,
  type: goalTypeSchema,
  targetAmount: positiveAmountSchema,
  currentAmount: nonNegativeAmountSchema.optional().default(0),
  deadline: dateStringSchema.optional().nullable(),
  priority: z.number().int().positive().max(10).optional().default(1),
  icon: iconSchema,
  color: hexColorSchema,
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Update savings goal request body
 */
export const updateGoalSchema = z.object({
  name: nameSchema.optional(),
  type: goalTypeSchema.optional(),
  targetAmount: positiveAmountSchema.optional(),
  currentAmount: nonNegativeAmountSchema.optional(),
  deadline: dateStringSchema.optional().nullable(),
  priority: z.number().int().positive().max(10).optional(),
  icon: iconSchema.nullable(),
  color: hexColorSchema.nullable(),
  metadata: z.record(z.unknown()).optional(),
  isCompleted: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// ============================================================================
// Contribution Schemas
// ============================================================================

/**
 * Create contribution request body
 */
export const createContributionSchema = z.object({
  amount: positiveAmountSchema,
  note: notesSchema,
  transactionId: cuidSchema.optional().nullable(),
})

// ============================================================================
// Recurring Transaction Schemas
// ============================================================================

/**
 * Recurrence frequency enum
 */
export const frequencySchema = z.enum([
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
], {
  errorMap: () => ({ message: 'Invalid frequency' }),
})

/**
 * Create recurring transaction request body
 */
export const createRecurringTransactionSchema = z.object({
  name: nameSchema,
  description: z.string().trim().min(1).max(500),
  amount: positiveAmountSchema,
  type: transactionTypeSchema,
  category: z.string().trim().min(1, { message: 'Category is required' }),
  frequency: frequencySchema,
  startDate: dateStringSchema,
  endDate: dateStringSchema.optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  budgetId: cuidSchema.optional().nullable(),
}).refine(data => {
  // dayOfMonth required for MONTHLY, QUARTERLY, YEARLY
  if (['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(data.frequency)) {
    return data.dayOfMonth !== undefined && data.dayOfMonth !== null
  }
  return true
}, {
  message: 'dayOfMonth is required for monthly, quarterly, and yearly frequencies',
  path: ['dayOfMonth'],
}).refine(data => {
  // dayOfWeek required for WEEKLY, BIWEEKLY
  if (['WEEKLY', 'BIWEEKLY'].includes(data.frequency)) {
    return data.dayOfWeek !== undefined && data.dayOfWeek !== null
  }
  return true
}, {
  message: 'dayOfWeek is required for weekly and biweekly frequencies',
  path: ['dayOfWeek'],
})

/**
 * Update recurring transaction request body
 */
export const updateRecurringTransactionSchema = z.object({
  name: nameSchema.optional(),
  description: z.string().trim().min(1).max(500).optional(),
  amount: positiveAmountSchema.optional(),
  type: transactionTypeSchema.optional(),
  category: z.string().trim().min(1).optional(),
  frequency: frequencySchema.optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  budgetId: cuidSchema.optional().nullable(),
  isActive: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// ============================================================================
// House Goal Schemas
// ============================================================================

/**
 * Property type enum
 */
export const propertyTypeSchema = z.enum([
  'single_family',
  'condo',
  'townhouse',
  'multi_family',
  'apartment',
  'land',
]).optional()

/**
 * Create/update house goal request body
 */
export const houseGoalSchema = z.object({
  targetPrice: positiveAmountSchema,
  targetLocation: z.string().trim().max(200).optional(),
  targetBedrooms: z.number().int().positive().max(20).optional(),
  targetBathrooms: z.number().positive().max(20).optional(),
  downPaymentPct: percentageSchema.optional().default(20),
  propertyType: propertyTypeSchema,
})

/**
 * Property search query params
 */
export const propertySearchQuerySchema = z.object({
  location: z.string().trim().min(1, { message: 'Location is required' }),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().positive().optional(),
  bathrooms: z.coerce.number().positive().optional(),
  propertyType: propertyTypeSchema,
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
}).refine(data => {
  if (data.minPrice && data.maxPrice) {
    return data.minPrice <= data.maxPrice
  }
  return true
}, {
  message: 'minPrice must be less than or equal to maxPrice',
})

/**
 * Mortgage calculation request body
 */
export const mortgageCalculateSchema = z.object({
  homePrice: positiveAmountSchema,
  downPaymentPct: percentageSchema,
  interestRate: z.number().positive().max(30, { message: 'Interest rate seems too high' }),
  loanTermYears: z.number().int().positive().max(50),
  propertyTaxRate: z.number().nonnegative().max(10).optional(),
  insuranceRate: z.number().nonnegative().max(5).optional(),
  pmiRate: z.number().nonnegative().max(5).optional(),
  hoaMonthly: nonNegativeAmountSchema.optional(),
})

/**
 * Save property request body
 */
export const savePropertySchema = z.object({
  zpid: z.string().optional(),
  address: z.string().trim().min(1, { message: 'Address is required' }).max(500),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(50),
  zipCode: z.string().trim().min(1).max(20),
  price: positiveAmountSchema,
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  sqft: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  propertyType: z.string().optional(),
  zestimate: positiveAmountSchema.optional(),
  imageUrl: z.string().url().optional(),
  listingUrl: z.string().url().optional(),
  notes: notesSchema,
})

// ============================================================================
// Bank Account Schemas
// ============================================================================

/**
 * Account type enum
 */
export const accountTypeSchema = z.enum([
  'CREDIT_CARD',
  'CHECKING',
  'SAVINGS',
  'INVESTMENT',
], {
  errorMap: () => ({ message: 'Invalid account type' }),
})

/**
 * Create bank account request body
 */
export const createBankAccountSchema = z.object({
  name: nameSchema,
  bankName: z.string().trim().min(1).max(100),
  accountType: accountTypeSchema,
  lastFour: z.string().regex(/^\d{4}$/, { message: 'Must be exactly 4 digits' }).optional(),
})

/**
 * Update bank account request body
 */
export const updateBankAccountSchema = z.object({
  name: nameSchema.optional(),
  bankName: z.string().trim().min(1).max(100).optional(),
  accountType: accountTypeSchema.optional(),
  lastFour: z.string().regex(/^\d{4}$/).optional().nullable(),
  isActive: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// ============================================================================
// Export all schemas
// ============================================================================

export const financeSchemas = {
  // Budgets
  createBudget: createBudgetSchema,
  updateBudget: updateBudgetSchema,

  // Transactions
  createTransaction: createTransactionSchema,
  updateTransaction: updateTransactionSchema,
  transactionListQuery: transactionListQuerySchema,

  // Categories
  createCategory: createCategorySchema,
  updateCategory: updateCategorySchema,

  // Goals
  createGoal: createGoalSchema,
  updateGoal: updateGoalSchema,

  // Contributions
  createContribution: createContributionSchema,

  // Recurring
  createRecurring: createRecurringTransactionSchema,
  updateRecurring: updateRecurringTransactionSchema,

  // House
  houseGoal: houseGoalSchema,
  propertySearch: propertySearchQuerySchema,
  mortgageCalculate: mortgageCalculateSchema,
  saveProperty: savePropertySchema,

  // Bank Accounts
  createBankAccount: createBankAccountSchema,
  updateBankAccount: updateBankAccountSchema,
}
