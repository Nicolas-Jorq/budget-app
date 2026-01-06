/**
 * @fileoverview Health Module Routes
 *
 * API routes for health tracking features.
 * All routes require authentication.
 *
 * @module modules/health/health-routes
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as controller from './health.controller.js'

const router = Router()

// All health routes require authentication
router.use(authenticate)

// ==========================================
// Dashboard
// ==========================================

/**
 * GET /api/health/dashboard
 * Get health dashboard summary
 */
router.get('/dashboard', controller.getDashboardSummary)

// ==========================================
// Workouts
// ==========================================

/**
 * GET /api/health/workouts
 * Get all workouts
 */
router.get('/workouts', controller.getWorkouts)

/**
 * GET /api/health/workouts/stats
 * Get workout statistics
 */
router.get('/workouts/stats', controller.getWorkoutStats)

/**
 * GET /api/health/workouts/:id
 * Get a specific workout
 */
router.get('/workouts/:id', controller.getWorkout)

/**
 * POST /api/health/workouts
 * Create a new workout
 */
router.post('/workouts', controller.createWorkout)

/**
 * PUT /api/health/workouts/:id
 * Update a workout
 */
router.put('/workouts/:id', controller.updateWorkout)

/**
 * DELETE /api/health/workouts/:id
 * Delete a workout
 */
router.delete('/workouts/:id', controller.deleteWorkout)

// ==========================================
// Weight
// ==========================================

/**
 * GET /api/health/weight
 * Get weight logs
 */
router.get('/weight', controller.getWeightLogs)

/**
 * GET /api/health/weight/progress
 * Get weight progress over time
 */
router.get('/weight/progress', controller.getWeightProgress)

/**
 * POST /api/health/weight
 * Log a new weight entry
 */
router.post('/weight', controller.createWeightLog)

/**
 * DELETE /api/health/weight/:id
 * Delete a weight log
 */
router.delete('/weight/:id', controller.deleteWeightLog)

// ==========================================
// Nutrition/Meals
// ==========================================

/**
 * GET /api/health/meals
 * Get meals (optionally filtered by date)
 */
router.get('/meals', controller.getMeals)

/**
 * GET /api/health/nutrition/daily
 * Get daily nutrition totals
 */
router.get('/nutrition/daily', controller.getDailyNutrition)

/**
 * POST /api/health/meals
 * Log a new meal
 */
router.post('/meals', controller.createMeal)

/**
 * PUT /api/health/meals/:id
 * Update a meal
 */
router.put('/meals/:id', controller.updateMeal)

/**
 * DELETE /api/health/meals/:id
 * Delete a meal
 */
router.delete('/meals/:id', controller.deleteMeal)

// ==========================================
// Sleep
// ==========================================

/**
 * GET /api/health/sleep
 * Get sleep logs
 */
router.get('/sleep', controller.getSleepLogs)

/**
 * GET /api/health/sleep/stats
 * Get sleep statistics
 */
router.get('/sleep/stats', controller.getSleepStats)

/**
 * POST /api/health/sleep
 * Log sleep
 */
router.post('/sleep', controller.createSleepLog)

/**
 * DELETE /api/health/sleep/:id
 * Delete a sleep log
 */
router.delete('/sleep/:id', controller.deleteSleepLog)

// ==========================================
// Water
// ==========================================

/**
 * GET /api/health/water
 * Get today's water intake
 */
router.get('/water', controller.getWaterToday)

/**
 * POST /api/health/water
 * Log water intake
 */
router.post('/water', controller.addWater)

// ==========================================
// Health Goals
// ==========================================

/**
 * GET /api/health/goals
 * Get health goals
 */
router.get('/goals', controller.getHealthGoals)

/**
 * POST /api/health/goals
 * Create a health goal
 */
router.post('/goals', controller.createHealthGoal)

/**
 * PUT /api/health/goals/:id/progress
 * Update goal progress
 */
router.put('/goals/:id/progress', controller.updateHealthGoalProgress)

/**
 * DELETE /api/health/goals/:id
 * Delete a health goal
 */
router.delete('/goals/:id', controller.deleteHealthGoal)

export default router
