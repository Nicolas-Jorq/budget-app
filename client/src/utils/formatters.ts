/**
 * @fileoverview Centralized formatting utilities for the Budget App frontend.
 *
 * This module provides consistent formatting for:
 * - Currency values
 * - Percentages
 * - Dates and times
 * - File sizes
 * - Numbers
 *
 * Using these utilities ensures consistent formatting across the application
 * and makes it easy to change formatting globally if needed.
 *
 * @module utils/formatters
 *
 * @example
 * import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
 *
 * // Display a price
 * <span>{formatCurrency(1234.56)}</span>  // "$1,234.56"
 *
 * // Display a date
 * <span>{formatDate(transaction.date)}</span>  // "Jan 15, 2024"
 *
 * // Display progress
 * <span>{formatPercentage(0.754)}</span>  // "75.4%"
 */

/**
 * Default locale for all formatting operations.
 * Change this to support different regions.
 */
const DEFAULT_LOCALE = 'en-US'

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Formats a number as US currency with the dollar sign and comma separators.
 *
 * @param value - The numeric value to format
 * @param options - Optional configuration
 * @param options.decimals - Number of decimal places (default: 2)
 * @param options.showSign - Whether to show +/- for positive/negative values
 * @returns Formatted currency string (e.g., "$1,234.56")
 *
 * @example
 * formatCurrency(1234.5)        // "$1,234.50"
 * formatCurrency(1234.567)      // "$1,234.57" (rounded)
 * formatCurrency(1234, { decimals: 0 })  // "$1,234"
 * formatCurrency(100, { showSign: true }) // "+$100.00"
 * formatCurrency(-50, { showSign: true }) // "-$50.00"
 */
export function formatCurrency(
  value: number | string,
  options: { decimals?: number; showSign?: boolean } = {}
): string {
  const { decimals = 2, showSign = false } = options
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '$0.00'
  }

  const formatted = Math.abs(numValue).toLocaleString(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  const prefix = showSign && numValue > 0 ? '+$' : numValue < 0 ? '-$' : '$'
  return `${prefix}${formatted}`
}

/**
 * Formats a number with commas for thousands, without currency symbol.
 *
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string (e.g., "1,234,567")
 *
 * @example
 * formatNumber(1234567)     // "1,234,567"
 * formatNumber(1234.5678, 2) // "1,234.57"
 */
export function formatNumber(value: number | string, decimals: number = 0): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '0'
  }

  return numValue.toLocaleString(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Formats a number in compact notation (e.g., 1.2K, 5.5M).
 * Useful for displaying large numbers in limited space.
 *
 * @param value - The numeric value to format
 * @returns Compact formatted string
 *
 * @example
 * formatCompact(1500)      // "1.5K"
 * formatCompact(2500000)   // "2.5M"
 * formatCompact(500)       // "500"
 */
export function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

// ============================================================================
// PERCENTAGE FORMATTING
// ============================================================================

/**
 * Formats a decimal as a percentage string.
 *
 * @param value - The value to format (0-1 for decimal, or already a percentage)
 * @param options - Optional configuration
 * @param options.decimals - Number of decimal places (default: 1)
 * @param options.isDecimal - Whether input is decimal 0-1 (default: false, assumes 0-100)
 * @returns Formatted percentage string (e.g., "75.5%")
 *
 * @example
 * formatPercentage(75.5)                    // "75.5%"
 * formatPercentage(0.755, { isDecimal: true }) // "75.5%"
 * formatPercentage(100, { decimals: 0 })    // "100%"
 */
export function formatPercentage(
  value: number,
  options: { decimals?: number; isDecimal?: boolean } = {}
): string {
  const { decimals = 1, isDecimal = false } = options
  const percentage = isDecimal ? value * 100 : value

  return `${percentage.toFixed(decimals)}%`
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Formats a date for display (e.g., "Jan 15, 2024").
 *
 * @param date - Date string, Date object, or timestamp
 * @param options - Intl.DateTimeFormat options for customization
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15')                    // "Jan 15, 2024"
 * formatDate(new Date())                      // "Jan 6, 2026"
 * formatDate('2024-01-15', { month: 'long' }) // "January 15, 2024"
 */
export function formatDate(
  date: string | Date | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = date instanceof Date ? date : new Date(date)

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }

  return dateObj.toLocaleDateString(DEFAULT_LOCALE, defaultOptions)
}

/**
 * Formats a date in long format (e.g., "January 15, 2024").
 *
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string with full month name
 *
 * @example
 * formatDateLong('2024-01-15') // "January 15, 2024"
 */
export function formatDateLong(date: string | Date | number): string {
  return formatDate(date, { month: 'long' })
}

/**
 * Converts a date to ISO date string format (YYYY-MM-DD).
 * Useful for HTML date input values.
 *
 * @param date - Date string, Date object, or timestamp
 * @returns ISO date string (e.g., "2024-01-15")
 *
 * @example
 * toISODateString(new Date())       // "2026-01-06"
 * toISODateString('Jan 15, 2024')   // "2024-01-15"
 */
export function toISODateString(date: string | Date | number): string {
  const dateObj = date instanceof Date ? date : new Date(date)

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return dateObj.toISOString().split('T')[0]
}

/**
 * Calculates the number of days between two dates.
 *
 * @param date1 - First date
 * @param date2 - Second date (defaults to current date)
 * @returns Number of days difference (positive if date1 is in the future)
 *
 * @example
 * daysBetween('2024-12-31')  // Days until Dec 31, 2024
 * daysBetween(goal.deadline) // Days remaining for goal
 */
export function daysBetween(
  date1: string | Date | number,
  date2: string | Date | number = new Date()
): number {
  const d1 = date1 instanceof Date ? date1 : new Date(date1)
  const d2 = date2 instanceof Date ? date2 : new Date(date2)

  const diffTime = d1.getTime() - d2.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Formats a date relative to now (e.g., "2 days ago", "in 3 months").
 *
 * @param date - Date string, Date object, or timestamp
 * @returns Human-readable relative time string
 *
 * @example
 * formatRelativeDate('2024-01-01') // "1 year ago"
 * formatRelativeDate(futureDate)   // "in 3 months"
 */
export function formatRelativeDate(date: string | Date | number): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffDays = daysBetween(dateObj, now)

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'

  if (diffDays > 0) {
    if (diffDays < 7) return `in ${diffDays} days`
    if (diffDays < 30) return `in ${Math.ceil(diffDays / 7)} weeks`
    if (diffDays < 365) return `in ${Math.ceil(diffDays / 30)} months`
    return `in ${Math.ceil(diffDays / 365)} years`
  }

  const absDays = Math.abs(diffDays)
  if (absDays < 7) return `${absDays} days ago`
  if (absDays < 30) return `${Math.ceil(absDays / 7)} weeks ago`
  if (absDays < 365) return `${Math.ceil(absDays / 30)} months ago`
  return `${Math.ceil(absDays / 365)} years ago`
}

// ============================================================================
// FILE SIZE FORMATTING
// ============================================================================

/**
 * Formats a file size in bytes to a human-readable string.
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted file size string (e.g., "1.5 MB")
 *
 * @example
 * formatFileSize(1024)        // "1.0 KB"
 * formatFileSize(1048576)     // "1.0 MB"
 * formatFileSize(500)         // "500 B"
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  if (i === 0) return `${bytes} B`

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

// ============================================================================
// TRANSACTION FORMATTING
// ============================================================================

/**
 * Formats a transaction amount with appropriate sign.
 *
 * @param amount - The transaction amount
 * @param type - Transaction type ('income' or 'expense')
 * @returns Formatted string with + or - prefix
 *
 * @example
 * formatTransactionAmount(100, 'income')  // "+$100.00"
 * formatTransactionAmount(50, 'expense')  // "-$50.00"
 */
export function formatTransactionAmount(
  amount: number | string,
  type: 'income' | 'expense' | 'INCOME' | 'EXPENSE'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const isIncome = type.toLowerCase() === 'income'

  return isIncome
    ? `+${formatCurrency(numAmount)}`
    : `-${formatCurrency(numAmount)}`
}

// ============================================================================
// GOAL PROGRESS FORMATTING
// ============================================================================

/**
 * Calculates and formats goal progress.
 *
 * @param current - Current amount saved
 * @param target - Target amount
 * @returns Object with formatted progress data
 *
 * @example
 * const progress = getGoalProgress(750, 1000);
 * // { current: "$750.00", target: "$1,000.00", remaining: "$250.00", percentage: "75.0%" }
 */
export function getGoalProgress(
  current: number,
  target: number
): {
  current: string
  target: string
  remaining: string
  percentage: string
  percentageValue: number
} {
  const remaining = Math.max(target - current, 0)
  const percentageValue = target > 0 ? (current / target) * 100 : 0

  return {
    current: formatCurrency(current),
    target: formatCurrency(target),
    remaining: formatCurrency(remaining),
    percentage: formatPercentage(percentageValue),
    percentageValue,
  }
}
