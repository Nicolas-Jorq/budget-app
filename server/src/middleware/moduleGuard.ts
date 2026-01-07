/**
 * @fileoverview Module access guard middleware.
 *
 * This middleware enforces that users can only access modules they have enabled.
 * FINANCE module is always accessible (core module).
 *
 * @module middleware/moduleGuard
 */

import { Response, NextFunction } from 'express'
import { ModuleType } from '@prisma/client'
import { AuthRequest } from './auth.js'
import { modulesService } from '../modules/core/modules.service.js'
import { AppError, HttpStatus, ErrorCode } from '../utils/errors.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('module-guard')

/**
 * Module access map for human-readable module names
 */
const MODULE_NAMES: Record<ModuleType, string> = {
  FINANCE: 'Finance',
  HEALTH: 'Health',
  TASKS: 'Tasks',
  LIFE_GOALS: 'Life Goals',
}

/**
 * Creates a middleware that requires a specific module to be enabled.
 *
 * @param module - The module type that must be enabled for access
 * @returns Express middleware function
 *
 * @example
 * // Protect health routes
 * router.use('/health', requireModule('HEALTH'), healthRoutes)
 *
 * @example
 * // Protect a specific endpoint
 * router.post('/tasks', requireModule('TASKS'), taskController.create)
 */
export function requireModule(module: ModuleType) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId

    if (!userId) {
      next(new AppError('Authentication required', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED))
      return
    }

    // FINANCE is always enabled (core module)
    if (module === 'FINANCE') {
      next()
      return
    }

    try {
      const isEnabled = await modulesService.isModuleEnabled(userId, module)

      if (!isEnabled) {
        logger.warn('Module access denied', { userId, module })
        next(
          new AppError(
            `The ${MODULE_NAMES[module]} module is not enabled. Enable it in settings to access this feature.`,
            HttpStatus.FORBIDDEN,
            ErrorCode.FORBIDDEN,
            { module }
          )
        )
        return
      }

      next()
    } catch (error) {
      logger.error('Module guard error', { error, userId, module })
      next(AppError.internal('Failed to verify module access'))
    }
  }
}

/**
 * Middleware that attaches enabled modules to the request for use in controllers.
 * This is useful for conditional rendering or logic based on available modules.
 *
 * @example
 * // In routes
 * router.use(attachModules)
 *
 * // In controller
 * const { enabledModules } = req
 * if (enabledModules.includes('HEALTH')) {
 *   // Include health data
 * }
 */
export async function attachModules(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.userId

  if (!userId) {
    next()
    return
  }

  try {
    const modules = await modulesService.getEnabledModules(userId)
    ;(req as AuthRequest & { enabledModules: ModuleType[] }).enabledModules = modules.map(
      (m) => m.module
    )
    next()
  } catch (error) {
    logger.error('Failed to attach modules', { error, userId })
    // Don't block the request if we can't fetch modules
    next()
  }
}

/**
 * Extended auth request with enabled modules
 */
export interface ModuleAwareRequest extends AuthRequest {
  enabledModules?: ModuleType[]
}
