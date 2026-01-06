/**
 * @fileoverview Centralized constants for the Budget App frontend.
 *
 * This module provides shared constants including:
 * - Category definitions for transactions and budgets
 * - Color palettes for charts and UI elements
 * - Configuration values
 *
 * Using centralized constants ensures consistency across the application
 * and makes it easy to update values in one place.
 *
 * @module utils/constants
 *
 * @example
 * import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ALL_CATEGORIES } from '../utils/constants';
 *
 * // Use in a select dropdown
 * <select>
 *   {EXPENSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
 * </select>
 */

// ============================================================================
// CATEGORY CONSTANTS
// ============================================================================

/**
 * Categories for expense transactions and budgets.
 * These represent common spending categories.
 */
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Travel',
  'Education',
  'Other',
] as const

/**
 * Categories specific to income transactions.
 * These represent common income sources.
 */
export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Rental Income',
  'Side Hustle',
  'Bonus',
  'Gift',
  'Refund',
  'Other Income',
] as const

/**
 * All categories combined for transaction forms.
 * Use this when both income and expense categories should be available.
 */
export const ALL_CATEGORIES = [
  ...EXPENSE_CATEGORIES.filter(c => c !== 'Other'),
  ...INCOME_CATEGORIES.filter(c => c !== 'Other Income'),
  'Other',
] as const

/**
 * Type for expense category values.
 */
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

/**
 * Type for income category values.
 */
export type IncomeCategory = typeof INCOME_CATEGORIES[number]

// ============================================================================
// CHART COLORS
// ============================================================================

/**
 * Color palette for charts and category displays.
 * Each category maps to a consistent color across the app.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#ef4444',      // Red
  'Transportation': '#f97316',     // Orange
  'Shopping': '#eab308',           // Yellow
  'Entertainment': '#22c55e',      // Green
  'Bills & Utilities': '#06b6d4',  // Cyan
  'Health': '#3b82f6',             // Blue
  'Travel': '#8b5cf6',             // Purple
  'Education': '#ec4899',          // Pink
  'Salary': '#10b981',             // Emerald
  'Freelance': '#14b8a6',          // Teal
  'Investment': '#6366f1',         // Indigo
  'Other': '#6b7280',              // Gray
}

/**
 * Chart color palette for sequential data visualization.
 * Use for pie charts, bar charts, etc.
 */
export const CHART_COLORS = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f97316', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#14b8a6', // Teal
] as const

// ============================================================================
// STATUS COLORS
// ============================================================================

/**
 * Semantic color classes for different status states.
 * Uses Tailwind CSS classes.
 */
export const STATUS_COLORS = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  neutral: 'text-gray-600 dark:text-gray-400',
} as const

/**
 * Background color classes for status badges.
 */
export const STATUS_BG_COLORS = {
  success: 'bg-green-100 dark:bg-green-900/30',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30',
  error: 'bg-red-100 dark:bg-red-900/30',
  info: 'bg-blue-100 dark:bg-blue-900/30',
  neutral: 'bg-gray-100 dark:bg-gray-900/30',
} as const

// ============================================================================
// BUDGET STATUS THRESHOLDS
// ============================================================================

/**
 * Thresholds for budget status colors.
 * Used to determine when budgets are healthy, warning, or critical.
 */
export const BUDGET_THRESHOLDS = {
  /** Percentage at which budget shows warning (orange) */
  WARNING: 80,
  /** Percentage at which budget shows danger (red) */
  DANGER: 100,
} as const

/**
 * Returns the appropriate status based on budget percentage used.
 *
 * @param percentageUsed - Current percentage of budget spent (0-100+)
 * @returns Status key for color lookup
 *
 * @example
 * const status = getBudgetStatus(85);  // 'warning'
 * const colorClass = STATUS_COLORS[status];
 */
export function getBudgetStatus(percentageUsed: number): keyof typeof STATUS_COLORS {
  if (percentageUsed >= BUDGET_THRESHOLDS.DANGER) return 'error'
  if (percentageUsed >= BUDGET_THRESHOLDS.WARNING) return 'warning'
  return 'success'
}

// ============================================================================
// TIME CONSTANTS
// ============================================================================

/**
 * Months of the year for date selection dropdowns.
 */
export const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
] as const

/**
 * Short month names.
 */
export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Validation limits for form inputs.
 */
export const VALIDATION = {
  /** Minimum transaction amount */
  MIN_AMOUNT: 0.01,
  /** Maximum transaction/budget amount */
  MAX_AMOUNT: 999999999.99,
  /** Maximum length for description fields */
  MAX_DESCRIPTION_LENGTH: 500,
  /** Maximum length for name fields */
  MAX_NAME_LENGTH: 100,
} as const

// ============================================================================
// API CONFIGURATION
// ============================================================================

/**
 * API-related constants.
 */
export const API = {
  /** Default page size for paginated lists */
  DEFAULT_PAGE_SIZE: 20,
  /** Debounce delay for search inputs (ms) */
  SEARCH_DEBOUNCE_MS: 300,
  /** Timeout for API requests (ms) */
  REQUEST_TIMEOUT_MS: 30000,
} as const

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

/**
 * Keys for localStorage to ensure consistency.
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed',
} as const
