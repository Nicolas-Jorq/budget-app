/**
 * @fileoverview Common Zod schemas used across modules.
 *
 * Contains reusable schemas for IDs, pagination, dates, and other shared patterns.
 *
 * @module schemas/common
 */

import { z } from 'zod'

// ============================================================================
// ID Schemas
// ============================================================================

/**
 * CUID identifier schema (Prisma default ID format)
 */
export const cuidSchema = z.string().cuid({ message: 'Invalid ID format' })

/**
 * URL params with ID
 */
export const idParamSchema = z.object({
  id: cuidSchema,
})

/**
 * URL params with goalId
 */
export const goalIdParamSchema = z.object({
  goalId: cuidSchema,
})

/**
 * URL params with goalId and propertyId
 */
export const goalPropertyParamSchema = z.object({
  goalId: cuidSchema,
  propertyId: cuidSchema,
})

// ============================================================================
// Pagination Schemas
// ============================================================================

/**
 * Standard pagination query params
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// ============================================================================
// Date Schemas
// ============================================================================

/**
 * ISO date string (YYYY-MM-DD format)
 */
export const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
)

/**
 * ISO datetime string
 */
export const datetimeStringSchema = z.string().datetime({ message: 'Invalid datetime format' })

/**
 * Date range query params
 */
export const dateRangeSchema = z.object({
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
// Money Schemas
// ============================================================================

/**
 * Positive money amount
 */
export const positiveAmountSchema = z.number()
  .positive({ message: 'Amount must be greater than 0' })
  .multipleOf(0.01, { message: 'Amount can have at most 2 decimal places' })

/**
 * Non-negative money amount (allows 0)
 */
export const nonNegativeAmountSchema = z.number()
  .nonnegative({ message: 'Amount cannot be negative' })
  .multipleOf(0.01, { message: 'Amount can have at most 2 decimal places' })

/**
 * Percentage (0-100)
 */
export const percentageSchema = z.number()
  .min(0, { message: 'Percentage must be at least 0' })
  .max(100, { message: 'Percentage must be at most 100' })

// ============================================================================
// String Schemas
// ============================================================================

/**
 * Non-empty trimmed string
 */
export const requiredStringSchema = z.string()
  .trim()
  .min(1, { message: 'This field is required' })

/**
 * Optional trimmed string (empty string becomes undefined)
 */
export const optionalStringSchema = z.string()
  .trim()
  .transform(val => val === '' ? undefined : val)
  .optional()

/**
 * Name field (1-100 chars)
 */
export const nameSchema = z.string()
  .trim()
  .min(1, { message: 'Name is required' })
  .max(100, { message: 'Name must be at most 100 characters' })

/**
 * Description field (0-1000 chars)
 */
export const descriptionSchema = z.string()
  .trim()
  .max(1000, { message: 'Description must be at most 1000 characters' })
  .optional()

/**
 * Notes field (0-5000 chars)
 */
export const notesSchema = z.string()
  .trim()
  .max(5000, { message: 'Notes must be at most 5000 characters' })
  .optional()

// ============================================================================
// Color & Icon Schemas
// ============================================================================

/**
 * Hex color code
 */
export const hexColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color format (e.g., #FF5500)' })
  .optional()

/**
 * Emoji or icon string
 */
export const iconSchema = z.string()
  .max(10, { message: 'Icon must be at most 10 characters' })
  .optional()
