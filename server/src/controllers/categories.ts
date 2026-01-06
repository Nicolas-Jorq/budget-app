/**
 * @fileoverview Categories Controller
 *
 * Handles HTTP requests for category management.
 * Categories are user-configurable and can be of type EXPENSE, INCOME, or BOTH.
 *
 * @module controllers/categories
 */

import { Response, NextFunction } from 'express'
import { categoriesService } from '../services/categories'
import { AuthRequest } from '../middleware/auth.js'

/**
 * Get all categories for the authenticated user.
 * Query params:
 *   - type: 'expense' | 'income' (optional, filters by type)
 */
export async function getCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const { type } = req.query

    let categories
    if (type === 'expense' || type === 'income') {
      categories = await categoriesService.getByType(userId, type)
    } else {
      categories = await categoriesService.getAll(userId)
    }

    res.json(categories)
  } catch (error) {
    next(error)
  }
}

/**
 * Get a single category by ID.
 */
export async function getCategoryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const { id } = req.params

    const category = await categoriesService.getById(userId, id)

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json(category)
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new category.
 * Body: { name, type, color?, icon?, sortOrder? }
 */
export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const { name, type, color, icon, sortOrder } = req.body

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' })
    }

    if (!['EXPENSE', 'INCOME', 'BOTH'].includes(type)) {
      return res.status(400).json({ error: 'Type must be EXPENSE, INCOME, or BOTH' })
    }

    const category = await categoriesService.create(userId, {
      name,
      type,
      color,
      icon,
      sortOrder,
    })

    res.status(201).json(category)
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message })
    }
    next(error)
  }
}

/**
 * Update an existing category.
 * Body: { name?, type?, color?, icon?, sortOrder? }
 */
export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const { id } = req.params
    const { name, type, color, icon, sortOrder } = req.body

    if (type && !['EXPENSE', 'INCOME', 'BOTH'].includes(type)) {
      return res.status(400).json({ error: 'Type must be EXPENSE, INCOME, or BOTH' })
    }

    const category = await categoriesService.update(userId, id, {
      name,
      type,
      color,
      icon,
      sortOrder,
    })

    res.json(category)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message })
      }
    }
    next(error)
  }
}

/**
 * Delete a category.
 */
export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const { id } = req.params

    await categoriesService.delete(userId, id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ error: error.message })
    }
    next(error)
  }
}

/**
 * Reset all categories to defaults.
 */
export async function resetCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!

    const categories = await categoriesService.resetToDefaults(userId)

    res.json(categories)
  } catch (error) {
    next(error)
  }
}

/**
 * Update sort order for multiple categories.
 * Body: { updates: [{ id, sortOrder }, ...] }
 */
export async function updateSortOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const { updates } = req.body

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' })
    }

    const categories = await categoriesService.updateSortOrder(userId, updates)

    res.json(categories)
  } catch (error) {
    next(error)
  }
}
