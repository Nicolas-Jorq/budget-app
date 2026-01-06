/**
 * @fileoverview Categories Routes
 *
 * API routes for user-configurable category management.
 *
 * @module routes/categories
 */

import { Router } from 'express'
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  resetCategories,
  updateSortOrder,
} from '../controllers/categories'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All category routes require authentication
router.use(authenticate)

/**
 * GET /api/categories
 * Get all categories for the user.
 * Query: ?type=expense|income (optional)
 */
router.get('/', getCategories)

/**
 * POST /api/categories/reset
 * Reset categories to defaults.
 */
router.post('/reset', resetCategories)

/**
 * PUT /api/categories/sort
 * Update sort order for multiple categories.
 */
router.put('/sort', updateSortOrder)

/**
 * GET /api/categories/:id
 * Get a single category by ID.
 */
router.get('/:id', getCategoryById)

/**
 * POST /api/categories
 * Create a new category.
 */
router.post('/', createCategory)

/**
 * PUT /api/categories/:id
 * Update a category.
 */
router.put('/:id', updateCategory)

/**
 * DELETE /api/categories/:id
 * Delete a category.
 */
router.delete('/:id', deleteCategory)

export default router
