/**
 * @fileoverview Life Goals Module Routes
 *
 * API routes for life goals and milestones.
 * All routes require authentication.
 *
 * @module modules/life-goals/life-goals-routes
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as controller from './life-goals.controller.js'

const router = Router()

// All life goals routes require authentication
router.use(authenticate)

// ==========================================
// Dashboard
// ==========================================

/**
 * GET /api/life-goals/dashboard
 * Get life goals dashboard summary
 */
router.get('/dashboard', controller.getDashboardSummary)

// ==========================================
// Life Goals
// ==========================================

/**
 * GET /api/life-goals
 * Get all life goals
 */
router.get('/', controller.getGoals)

/**
 * GET /api/life-goals/:id
 * Get a specific life goal
 */
router.get('/:id', controller.getGoal)

/**
 * POST /api/life-goals
 * Create a new life goal
 */
router.post('/', controller.createGoal)

/**
 * PUT /api/life-goals/:id
 * Update a life goal
 */
router.put('/:id', controller.updateGoal)

/**
 * DELETE /api/life-goals/:id
 * Delete a life goal
 */
router.delete('/:id', controller.deleteGoal)

// ==========================================
// Milestones
// ==========================================

/**
 * POST /api/life-goals/:goalId/milestones
 * Create a milestone for a goal
 */
router.post('/:goalId/milestones', controller.createMilestone)

/**
 * PUT /api/life-goals/milestones/:id
 * Update a milestone
 */
router.put('/milestones/:id', controller.updateMilestone)

/**
 * PATCH /api/life-goals/milestones/:id/toggle
 * Toggle milestone completion
 */
router.patch('/milestones/:id/toggle', controller.toggleMilestone)

/**
 * DELETE /api/life-goals/milestones/:id
 * Delete a milestone
 */
router.delete('/milestones/:id', controller.deleteMilestone)

export default router
