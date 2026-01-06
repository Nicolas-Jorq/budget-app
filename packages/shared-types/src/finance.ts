/**
 * @fileoverview Finance module types.
 * Types for budgets, transactions, categories, goals, and bank statements.
 */

import { BaseEntity, UserOwnedEntity } from './base'

// ==========================================
// Category Types
// ==========================================

export type CategoryType = 'EXPENSE' | 'INCOME' | 'BOTH'

export interface Category extends UserOwnedEntity {
  name: string
  type: CategoryType
  color?: string
  icon?: string
  isDefault: boolean
  sortOrder: number
}

export interface CreateCategoryInput {
  name: string
  type: CategoryType
  color?: string
  icon?: string
  sortOrder?: number
}

export interface UpdateCategoryInput {
  name?: string
  type?: CategoryType
  color?: string
  icon?: string
  sortOrder?: number
}

// ==========================================
// Budget Types
// ==========================================

export interface Budget extends UserOwnedEntity {
  name: string
  amount: number
  spent: number
  category: string
}

export interface CreateBudgetInput {
  name: string
  amount: number
  category: string
}

export interface UpdateBudgetInput {
  name?: string
  amount?: number
  category?: string
  spent?: number
}

// ==========================================
// Transaction Types
// ==========================================

export type TransactionType = 'income' | 'expense'

export interface Transaction extends UserOwnedEntity {
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  budgetId?: string
  recurringTransactionId?: string
}

export interface CreateTransactionInput {
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  budgetId?: string
}

export interface UpdateTransactionInput {
  description?: string
  amount?: number
  type?: TransactionType
  category?: string
  date?: string
  budgetId?: string
}

// ==========================================
// Recurring Transaction Types
// ==========================================

export type RecurrenceFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'

export interface RecurringTransaction extends UserOwnedEntity {
  name: string
  description: string
  amount: number
  type: TransactionType
  category: string
  frequency: RecurrenceFrequency
  startDate: string
  endDate?: string
  dayOfMonth?: number
  dayOfWeek?: number
  budgetId?: string
  isActive: boolean
  lastGeneratedDate?: string
  nextDueDate: string
}

export interface CreateRecurringTransactionInput {
  name: string
  description: string
  amount: number
  type: TransactionType
  category: string
  frequency: RecurrenceFrequency
  startDate: string
  endDate?: string
  dayOfMonth?: number
  dayOfWeek?: number
  budgetId?: string
}

export interface UpdateRecurringTransactionInput {
  name?: string
  description?: string
  amount?: number
  type?: TransactionType
  category?: string
  frequency?: RecurrenceFrequency
  startDate?: string
  endDate?: string
  dayOfMonth?: number
  dayOfWeek?: number
  budgetId?: string
  isActive?: boolean
}

export const FREQUENCY_INFO: Record<
  RecurrenceFrequency,
  { label: string; shortLabel: string; days: number }
> = {
  DAILY: { label: 'Daily', shortLabel: 'Daily', days: 1 },
  WEEKLY: { label: 'Weekly', shortLabel: 'Weekly', days: 7 },
  BIWEEKLY: { label: 'Bi-weekly', shortLabel: 'Bi-wk', days: 14 },
  MONTHLY: { label: 'Monthly', shortLabel: 'Monthly', days: 30 },
  QUARTERLY: { label: 'Quarterly', shortLabel: 'Qtrly', days: 90 },
  YEARLY: { label: 'Yearly', shortLabel: 'Yearly', days: 365 },
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

// ==========================================
// Savings Goal Types
// ==========================================

export type GoalType =
  | 'EMERGENCY_FUND'
  | 'BABY'
  | 'HOUSE'
  | 'VEHICLE'
  | 'VACATION'
  | 'EDUCATION'
  | 'RETIREMENT'
  | 'CUSTOM'

export interface SavingsGoal extends UserOwnedEntity {
  name: string
  type: GoalType
  targetAmount: number
  currentAmount: number
  deadline?: string
  priority: number
  icon?: string
  color?: string
  metadata?: Record<string, unknown>
  isCompleted: boolean
}

export interface CreateSavingsGoalInput {
  name: string
  type: GoalType
  targetAmount: number
  deadline?: string
  priority?: number
  icon?: string
  color?: string
  metadata?: Record<string, unknown>
}

export interface UpdateSavingsGoalInput {
  name?: string
  type?: GoalType
  targetAmount?: number
  currentAmount?: number
  deadline?: string
  priority?: number
  icon?: string
  color?: string
  metadata?: Record<string, unknown>
  isCompleted?: boolean
}

export interface Contribution extends BaseEntity {
  amount: number
  note?: string
  goalId: string
  transactionId?: string
}

export interface CreateContributionInput {
  amount: number
  note?: string
  transactionId?: string
}

// ==========================================
// Baby Goal Types
// ==========================================

export type MilestoneCategory =
  | 'PRE_BIRTH'
  | 'NURSERY'
  | 'GEAR'
  | 'FIRST_YEAR'
  | 'CHILDCARE'
  | 'HEALTHCARE'
  | 'EDUCATION'

export interface BabyMilestone extends BaseEntity {
  goalId: string
  name: string
  category: MilestoneCategory
  targetAmount: number
  currentAmount: number
  isCompleted: boolean
  dueMonth?: number
  notes?: string
}

export interface CreateBabyMilestoneInput {
  name: string
  category: MilestoneCategory
  targetAmount: number
  dueMonth?: number
  notes?: string
}

// ==========================================
// House Goal Types
// ==========================================

export interface HouseGoal extends BaseEntity {
  goalId: string
  targetPrice: number
  targetLocation?: string
  targetBedrooms?: number
  targetBathrooms?: number
  downPaymentPct: number
  propertyType?: string
  savedSearches?: SavedSearch[]
}

export interface SavedSearch {
  id: string
  name: string
  location: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  createdAt: string
}

export interface PropertySnapshot extends BaseEntity {
  houseGoalId: string
  zpid?: string
  address: string
  city: string
  state: string
  zipCode: string
  price: number
  bedrooms?: number
  bathrooms?: number
  sqft?: number
  yearBuilt?: number
  propertyType?: string
  zestimate?: number
  imageUrl?: string
  listingUrl?: string
  isFavorite: boolean
  notes?: string
  capturedAt: string
}

// ==========================================
// Bank Statement Types
// ==========================================

export type AccountType = 'CREDIT_CARD' | 'CHECKING' | 'SAVINGS' | 'INVESTMENT'

export type DocumentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'REVIEWED'
  | 'IMPORTED'
  | 'FAILED'

export type PendingTransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPORTED'
  | 'DUPLICATE'

export interface BankAccount extends UserOwnedEntity {
  name: string
  bankName: string
  accountType: AccountType
  lastFour?: string
  isActive: boolean
}

export interface BankDocument extends UserOwnedEntity {
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  filePath: string
  status: DocumentStatus
  bankAccountId?: string
  statementStartDate?: string
  statementEndDate?: string
  extractedData?: Record<string, unknown>
  processingError?: string
  transactionCount?: number
  llmProvider?: string
  llmModel?: string
  processingTimeMs?: number
  uploadedAt: string
  processedAt?: string
}

export interface PendingTransaction extends BaseEntity {
  documentId: string
  date: string
  description: string
  originalDescription?: string
  amount: number
  type: string
  category?: string
  suggestedCategories?: SuggestedCategory[]
  confidence?: number
  rawText?: string
  lineNumber?: number
  status: PendingTransactionStatus
  userCategory?: string
  userNotes?: string
  importedTransactionId?: string
  duplicateOfId?: string
}

export interface SuggestedCategory {
  category: string
  confidence: number
}

// ==========================================
// Dashboard Types
// ==========================================

export interface DashboardStats {
  totalBudget: number
  totalSpent: number
  totalIncome: number
  totalExpenses: number
  budgetCount: number
  transactionCount: number
  savingsProgress?: number
}

export interface ChartData {
  categoryBreakdown: CategoryBreakdownItem[]
  monthlyTrend: MonthlyTrendItem[]
  budgetProgress: BudgetProgressItem[]
  recentTransactions: Transaction[]
}

export interface CategoryBreakdownItem {
  category: string
  amount: number
  percentage: number
  color?: string
}

export interface MonthlyTrendItem {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface BudgetProgressItem {
  name: string
  category: string
  spent: number
  total: number
  percentage: number
}
