/**
 * @fileoverview Tasks Module Routes
 *
 * API routes for task management features.
 * All routes require authentication.
 *
 * @module modules/tasks/tasks-routes
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { requireModule } from '../../middleware/moduleGuard.js'
import * as controller from './tasks.controller.js'

const router = Router()

// All tasks routes require authentication and TASKS module
router.use(authenticate)
router.use(requireModule('TASKS'))

// ==========================================
// Dashboard
// ==========================================

/**
 * GET /api/tasks/dashboard
 * Get tasks dashboard summary
 */
router.get('/dashboard', controller.getDashboardSummary)

// ==========================================
// Tasks
// ==========================================

/**
 * GET /api/tasks/today
 * Get tasks due today or overdue
 */
router.get('/today', controller.getTodaysTasks)

/**
 * GET /api/tasks
 * Get all tasks (with optional filters)
 */
router.get('/', controller.getTasks)

/**
 * GET /api/tasks/:id
 * Get a specific task
 */
router.get('/:id', controller.getTask)

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', controller.createTask)

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put('/:id', controller.updateTask)

/**
 * PATCH /api/tasks/:id/toggle
 * Toggle task completion status
 */
router.patch('/:id/toggle', controller.toggleTaskStatus)

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', controller.deleteTask)

// ==========================================
// Projects
// ==========================================

/**
 * GET /api/tasks/projects
 * Get all projects
 */
router.get('/projects', controller.getProjects)

/**
 * GET /api/tasks/projects/:id
 * Get a specific project with its tasks
 */
router.get('/projects/:id', controller.getProject)

/**
 * POST /api/tasks/projects
 * Create a new project
 */
router.post('/projects', controller.createProject)

/**
 * PUT /api/tasks/projects/:id
 * Update a project
 */
router.put('/projects/:id', controller.updateProject)

/**
 * DELETE /api/tasks/projects/:id
 * Delete a project
 */
router.delete('/projects/:id', controller.deleteProject)

// ==========================================
// Labels
// ==========================================

/**
 * GET /api/tasks/labels
 * Get all labels
 */
router.get('/labels', controller.getLabels)

/**
 * POST /api/tasks/labels
 * Create a new label
 */
router.post('/labels', controller.createLabel)

/**
 * PUT /api/tasks/labels/:id
 * Update a label
 */
router.put('/labels/:id', controller.updateLabel)

/**
 * DELETE /api/tasks/labels/:id
 * Delete a label
 */
router.delete('/labels/:id', controller.deleteLabel)

export default router
