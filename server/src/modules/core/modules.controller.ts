/**
 * @fileoverview Module Controller
 *
 * Handles HTTP requests for module management.
 *
 * @module modules/core/modules-controller
 */

import { Response, NextFunction } from 'express'
import { ModuleType } from '@prisma/client'
import { modulesService } from './modules.service'
import { AuthRequest } from '../../middleware/auth.js'

/**
 * Get all enabled modules for the authenticated user.
 */
export async function getEnabledModules(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const modules = await modulesService.getEnabledModules(userId)
    res.json(modules)
  } catch (error) {
    next(error)
  }
}

/**
 * Enable a module for the user.
 * Body: { module: ModuleType, settings?: object }
 */
export async function enableModule(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { module, settings } = req.body

    if (!module || !['FINANCE', 'HEALTH', 'TASKS', 'LIFE_GOALS'].includes(module)) {
      return res.status(400).json({
        error: 'Invalid module. Must be FINANCE, HEALTH, TASKS, or LIFE_GOALS',
      })
    }

    const userModule = await modulesService.enableModule(
      userId,
      module as ModuleType,
      settings
    )
    res.json(userModule)
  } catch (error) {
    next(error)
  }
}

/**
 * Disable a module for the user.
 */
export async function disableModule(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { module } = req.params

    if (!module || !['HEALTH', 'TASKS', 'LIFE_GOALS'].includes(module)) {
      return res.status(400).json({
        error: 'Invalid module or cannot disable FINANCE module',
      })
    }

    await modulesService.disableModule(userId, module as ModuleType)
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot disable')) {
      return res.status(400).json({ error: error.message })
    }
    next(error)
  }
}

/**
 * Update module settings.
 * Body: { settings: object }
 */
export async function updateModuleSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { module } = req.params
    const { settings } = req.body

    if (!module || !['FINANCE', 'HEALTH', 'TASKS', 'LIFE_GOALS'].includes(module)) {
      return res.status(400).json({ error: 'Invalid module' })
    }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings must be an object' })
    }

    const userModule = await modulesService.updateModuleSettings(
      userId,
      module as ModuleType,
      settings
    )
    res.json(userModule)
  } catch (error) {
    next(error)
  }
}

/**
 * Get Obsidian sync configuration.
 */
export async function getObsidianSync(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const sync = await modulesService.getObsidianSync(userId)
    res.json(sync || { isEnabled: false })
  } catch (error) {
    next(error)
  }
}

/**
 * Update Obsidian sync configuration.
 * Body: { vaultPath?, syncSettings?, isEnabled? }
 */
export async function updateObsidianSync(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { vaultPath, syncSettings, isEnabled } = req.body

    const sync = await modulesService.updateObsidianSync(userId, {
      vaultPath,
      syncSettings,
      isEnabled,
    })
    res.json(sync)
  } catch (error) {
    next(error)
  }
}
