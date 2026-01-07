/**
 * @fileoverview Request validation middleware using Zod.
 *
 * This middleware validates request body, params, and query against Zod schemas.
 * Invalid requests are rejected with detailed error messages.
 *
 * @module middleware/validate
 */

import { Request, Response, NextFunction } from 'express'
import { ZodError, ZodSchema } from 'zod'
import { AppError, HttpStatus, ErrorCode } from '../utils/errors.js'

/**
 * Validation target - which part of the request to validate
 */
type ValidationTarget = 'body' | 'params' | 'query'

/**
 * Schema configuration for validation
 */
interface ValidationSchema {
  body?: ZodSchema
  params?: ZodSchema
  query?: ZodSchema
}

/**
 * Formats Zod validation errors into a user-friendly structure.
 *
 * @param error - ZodError instance
 * @returns Object mapping field paths to error messages
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'value'
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }

  return formatted
}

/**
 * Creates a validation middleware for the specified schemas.
 *
 * @param schemas - Object containing Zod schemas for body, params, and/or query
 * @returns Express middleware function
 *
 * @example
 * // Validate request body
 * router.post('/', validate({ body: createBudgetSchema }), controller.create)
 *
 * @example
 * // Validate multiple parts
 * router.put('/:id',
 *   validate({
 *     params: z.object({ id: z.string().cuid() }),
 *     body: updateBudgetSchema
 *   }),
 *   controller.update
 * )
 */
export function validate(schemas: ValidationSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const errors: Record<string, Record<string, string[]>> = {}

    // Validate each target that has a schema
    const targets: ValidationTarget[] = ['body', 'params', 'query']

    for (const target of targets) {
      const schema = schemas[target]
      if (!schema) continue

      try {
        // Parse and replace with validated/transformed data
        const validated = await schema.parseAsync(req[target])
        req[target] = validated
      } catch (error) {
        if (error instanceof ZodError) {
          errors[target] = formatZodErrors(error)
        } else {
          throw error
        }
      }
    }

    // If there were validation errors, reject the request
    if (Object.keys(errors).length > 0) {
      const fieldErrors = Object.entries(errors)
        .flatMap(([target, fields]) =>
          Object.entries(fields).map(([field, messages]) => ({
            field: target === 'body' ? field : `${target}.${field}`,
            messages,
          }))
        )

      const firstError = fieldErrors[0]
      const message = `Validation failed: ${firstError.field} - ${firstError.messages[0]}`

      const appError = new AppError(
        message,
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        { errors: fieldErrors }
      )

      next(appError)
      return
    }

    next()
  }
}

/**
 * Shorthand for body-only validation.
 *
 * @param schema - Zod schema for request body
 * @returns Express middleware function
 *
 * @example
 * router.post('/', validateBody(createBudgetSchema), controller.create)
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema })
}

/**
 * Shorthand for params-only validation.
 *
 * @param schema - Zod schema for URL params
 * @returns Express middleware function
 *
 * @example
 * router.get('/:id', validateParams(idParamSchema), controller.getById)
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema })
}

/**
 * Shorthand for query-only validation.
 *
 * @param schema - Zod schema for query string
 * @returns Express middleware function
 *
 * @example
 * router.get('/', validateQuery(listQuerySchema), controller.list)
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema })
}
