/**
 * @fileoverview Health Module Controller
 *
 * HTTP request handlers for health tracking endpoints.
 *
 * @module modules/health/health-controller
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.js'
import {
  workoutService,
  weightService,
  mealService,
  sleepService,
  waterService,
  healthGoalService,
  healthDashboardService,
} from './health.service.js'
import {
  parseWeightCSV,
  importWeightData,
  getWeightProgressWithMA,
} from '../../services/weight-import.js'

// ==========================================
// Dashboard
// ==========================================

export async function getDashboardSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const summary = await healthDashboardService.getSummary(req.userId!)
    res.json(summary)
  } catch (error) {
    next(error)
  }
}

// ==========================================
// Workouts
// ==========================================

export async function getWorkouts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
    const workouts = await workoutService.getAll(req.userId!, limit)
    res.json(workouts)
  } catch (error) {
    next(error)
  }
}

export async function getWorkout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const workout = await workoutService.getById(req.params.id, req.userId!)
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' })
    }
    res.json(workout)
  } catch (error) {
    next(error)
  }
}

export async function createWorkout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, type, duration, calories, notes, exercises, date } = req.body
    const workout = await workoutService.create(req.userId!, {
      name,
      type,
      duration,
      calories,
      notes,
      exercises,
      date: date ? new Date(date) : undefined,
    })
    res.status(201).json(workout)
  } catch (error) {
    next(error)
  }
}

export async function updateWorkout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, type, duration, calories, notes, exercises, date } = req.body
    await workoutService.update(req.params.id, req.userId!, {
      name,
      type,
      duration,
      calories,
      notes,
      exercises,
      date: date ? new Date(date) : undefined,
    })
    res.json({ message: 'Workout updated' })
  } catch (error) {
    next(error)
  }
}

export async function deleteWorkout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await workoutService.delete(req.params.id, req.userId!)
    res.json({ message: 'Workout deleted' })
  } catch (error) {
    next(error)
  }
}

export async function getWorkoutStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30
    const stats = await workoutService.getStats(req.userId!, days)
    res.json(stats)
  } catch (error) {
    next(error)
  }
}

// ==========================================
// Weight
// ==========================================

export async function getWeightLogs(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const logs = await weightService.getAll(req.userId!, limit)
    res.json(logs)
  } catch (error) {
    next(error)
  }
}

export async function createWeightLog(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { weight, unit, bodyFat, notes, date } = req.body
    const log = await weightService.create(req.userId!, {
      weight,
      unit,
      bodyFat,
      notes,
      date: date ? new Date(date) : undefined,
    })
    res.status(201).json(log)
  } catch (error) {
    next(error)
  }
}

export async function deleteWeightLog(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await weightService.delete(req.params.id, req.userId!)
    res.json({ message: 'Weight log deleted' })
  } catch (error) {
    next(error)
  }
}

export async function getWeightProgress(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30
    const progress = await weightService.getProgress(req.userId!, days)
    res.json(progress)
  } catch (error) {
    next(error)
  }
}

/**
 * Get weight progress with moving average
 * GET /api/health/weight/chart
 */
export async function getWeightChart(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 90
    const data = await getWeightProgressWithMA(req.userId!, days)
    res.json(data)
  } catch (error) {
    next(error)
  }
}

/**
 * Import weight data from CSV
 * POST /api/health/weight/import
 */
export async function importWeight(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { csvContent, unit = 'lbs', skipDuplicates = true } = req.body

    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        message: 'Missing or invalid CSV content',
        error: 'csvContent must be a non-empty string',
      })
    }

    // Parse the CSV
    const { rows, errors, headers } = parseWeightCSV(csvContent)

    if (rows.length === 0) {
      return res.status(400).json({
        message: 'No valid data rows found in CSV',
        parseErrors: errors,
        detectedHeaders: headers,
      })
    }

    // If there are parse errors but some valid rows, include warnings
    const parseWarnings = errors.length > 0 ? errors : undefined

    // Import the data
    const result = await importWeightData(req.userId!, rows, {
      unit: unit as 'kg' | 'lbs',
      skipDuplicates,
    })

    res.status(result.success ? 200 : 207).json({
      ...result,
      parseWarnings,
      detectedHeaders: headers,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Preview CSV import (parse without saving)
 * POST /api/health/weight/import/preview
 */
export async function previewWeightImport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { csvContent } = req.body

    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        message: 'Missing or invalid CSV content',
      })
    }

    const { rows, errors, headers } = parseWeightCSV(csvContent)

    res.json({
      validRows: rows.length,
      parseErrors: errors,
      detectedHeaders: headers,
      preview: rows.slice(0, 10).map(row => ({
        date: row.date.toISOString().split('T')[0],
        weight: row.weight,
        movingAverage: row.movingAverage,
      })),
    })
  } catch (error) {
    next(error)
  }
}

// ==========================================
// Meals/Nutrition
// ==========================================

export async function getMeals(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : undefined
    const meals = await mealService.getAll(req.userId!, date)
    res.json(meals)
  } catch (error) {
    next(error)
  }
}

export async function createMeal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, type, calories, protein, carbs, fat, fiber, notes, date } = req.body
    const meal = await mealService.create(req.userId!, {
      name,
      type,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      notes,
      date: date ? new Date(date) : undefined,
    })
    res.status(201).json(meal)
  } catch (error) {
    next(error)
  }
}

export async function updateMeal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, type, calories, protein, carbs, fat, fiber, notes } = req.body
    await mealService.update(req.params.id, req.userId!, {
      name,
      type,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      notes,
    })
    res.json({ message: 'Meal updated' })
  } catch (error) {
    next(error)
  }
}

export async function deleteMeal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await mealService.delete(req.params.id, req.userId!)
    res.json({ message: 'Meal deleted' })
  } catch (error) {
    next(error)
  }
}

export async function getDailyNutrition(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date()
    const totals = await mealService.getDailyTotals(req.userId!, date)
    res.json(totals)
  } catch (error) {
    next(error)
  }
}

// ==========================================
// Sleep
// ==========================================

export async function getSleepLogs(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30
    const logs = await sleepService.getAll(req.userId!, limit)
    res.json(logs)
  } catch (error) {
    next(error)
  }
}

export async function createSleepLog(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { bedTime, wakeTime, quality, notes, date } = req.body
    const log = await sleepService.create(req.userId!, {
      bedTime: new Date(bedTime),
      wakeTime: new Date(wakeTime),
      quality,
      notes,
      date: date ? new Date(date) : undefined,
    })
    res.status(201).json(log)
  } catch (error) {
    next(error)
  }
}

export async function deleteSleepLog(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await sleepService.delete(req.params.id, req.userId!)
    res.json({ message: 'Sleep log deleted' })
  } catch (error) {
    next(error)
  }
}

export async function getSleepStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7
    const stats = await sleepService.getStats(req.userId!, days)
    res.json(stats)
  } catch (error) {
    next(error)
  }
}

// ==========================================
// Water
// ==========================================

export async function getWaterToday(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date()
    const water = await waterService.getDailyTotal(req.userId!, date)
    res.json(water)
  } catch (error) {
    next(error)
  }
}

export async function addWater(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { amount } = req.body
    const log = await waterService.addWater(req.userId!, amount)
    res.status(201).json(log)
  } catch (error) {
    next(error)
  }
}

// ==========================================
// Health Goals
// ==========================================

export async function getHealthGoals(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const goals = await healthGoalService.getAll(req.userId!)
    res.json(goals)
  } catch (error) {
    next(error)
  }
}

export async function createHealthGoal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { type, targetValue, unit, deadline } = req.body
    const goal = await healthGoalService.create(req.userId!, {
      type,
      targetValue,
      unit,
      deadline: deadline ? new Date(deadline) : undefined,
    })
    res.status(201).json(goal)
  } catch (error) {
    next(error)
  }
}

export async function updateHealthGoalProgress(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { currentValue } = req.body
    const goal = await healthGoalService.updateProgress(
      req.params.id,
      req.userId!,
      currentValue
    )
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' })
    }
    res.json(goal)
  } catch (error) {
    next(error)
  }
}

export async function deleteHealthGoal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await healthGoalService.delete(req.params.id, req.userId!)
    res.json({ message: 'Goal deleted' })
  } catch (error) {
    next(error)
  }
}
