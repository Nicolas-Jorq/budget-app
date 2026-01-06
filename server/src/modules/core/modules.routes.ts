/**
 * @fileoverview Module Routes
 *
 * API routes for module management.
 *
 * @module modules/core/modules-routes
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import {
  getEnabledModules,
  enableModule,
  disableModule,
  updateModuleSettings,
  getObsidianSync,
  updateObsidianSync,
} from './modules.controller'

const router = Router()

// All module routes require authentication
router.use(authenticate)

/**
 * GET /api/modules
 * Get all enabled modules for the user.
 */
router.get('/', getEnabledModules)

/**
 * POST /api/modules
 * Enable a new module.
 */
router.post('/', enableModule)

/**
 * DELETE /api/modules/:module
 * Disable a module.
 */
router.delete('/:module', disableModule)

/**
 * PUT /api/modules/:module/settings
 * Update module settings.
 */
router.put('/:module/settings', updateModuleSettings)

/**
 * GET /api/modules/obsidian
 * Get Obsidian sync configuration.
 */
router.get('/obsidian', getObsidianSync)

/**
 * PUT /api/modules/obsidian
 * Update Obsidian sync configuration.
 */
router.put('/obsidian', updateObsidianSync)

export default router
