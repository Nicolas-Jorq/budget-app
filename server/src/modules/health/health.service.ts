/**
 * @fileoverview Health Module Service
 *
 * Business logic for health tracking features:
 * - Workouts
 * - Weight tracking
 * - Nutrition/Meals
 * - Sleep tracking
 * - Water intake
 * - Health goals
 *
 * @module modules/health/health-service
 */

import { PrismaClient, WorkoutType, MealType, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ==========================================
// Workout Service
// ==========================================

export const workoutService = {
  async getAll(userId: string, limit = 50) {
    return prisma.workout.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    })
  },

  async getById(id: string, userId: string) {
    return prisma.workout.findFirst({
      where: { id, userId },
    })
  },

  async create(
    userId: string,
    data: {
      name: string
      type: WorkoutType
      duration: number
      calories?: number
      notes?: string
      exercises?: Prisma.InputJsonValue
      date?: Date
    }
  ) {
    return prisma.workout.create({
      data: {
        userId,
        ...data,
      },
    })
  },

  async update(
    id: string,
    userId: string,
    data: {
      name?: string
      type?: WorkoutType
      duration?: number
      calories?: number
      notes?: string
      exercises?: Prisma.InputJsonValue
      date?: Date
    }
  ) {
    return prisma.workout.updateMany({
      where: { id, userId },
      data,
    })
  },

  async delete(id: string, userId: string) {
    return prisma.workout.deleteMany({
      where: { id, userId },
    })
  },

  async getStats(userId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
    })

    const totalWorkouts = workouts.length
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0)
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0)

    const byType = workouts.reduce(
      (acc, w) => {
        acc[w.type] = (acc[w.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalWorkouts,
      totalDuration,
      totalCalories,
      avgDuration: totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0,
      byType,
    }
  },
}

// ==========================================
// Weight Service
// ==========================================

export const weightService = {
  async getAll(userId: string, limit = 100) {
    return prisma.weightLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    })
  },

  async getLatest(userId: string) {
    return prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    })
  },

  async create(
    userId: string,
    data: {
      weight: number
      unit?: string
      bodyFat?: number
      notes?: string
      date?: Date
    }
  ) {
    return prisma.weightLog.create({
      data: {
        userId,
        weight: data.weight,
        unit: data.unit || 'kg',
        bodyFat: data.bodyFat,
        notes: data.notes,
        date: data.date || new Date(),
      },
    })
  },

  async delete(id: string, userId: string) {
    return prisma.weightLog.deleteMany({
      where: { id, userId },
    })
  },

  async getProgress(userId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await prisma.weightLog.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    })

    if (logs.length < 2) {
      return { change: 0, logs }
    }

    const firstWeight = Number(logs[0].weight)
    const lastWeight = Number(logs[logs.length - 1].weight)
    const change = lastWeight - firstWeight

    return { change, logs }
  },
}

// ==========================================
// Meal/Nutrition Service
// ==========================================

export const mealService = {
  async getAll(userId: string, date?: Date) {
    const where: Prisma.MealWhereInput = { userId }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    return prisma.meal.findMany({
      where,
      orderBy: { date: 'desc' },
    })
  },

  async create(
    userId: string,
    data: {
      name: string
      type: MealType
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
      fiber?: number
      notes?: string
      date?: Date
    }
  ) {
    return prisma.meal.create({
      data: {
        userId,
        ...data,
      },
    })
  },

  async update(
    id: string,
    userId: string,
    data: {
      name?: string
      type?: MealType
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
      fiber?: number
      notes?: string
    }
  ) {
    return prisma.meal.updateMany({
      where: { id, userId },
      data,
    })
  },

  async delete(id: string, userId: string) {
    return prisma.meal.deleteMany({
      where: { id, userId },
    })
  },

  async getDailyTotals(userId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const meals = await prisma.meal.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    return {
      calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein: meals.reduce((sum, m) => sum + Number(m.protein || 0), 0),
      carbs: meals.reduce((sum, m) => sum + Number(m.carbs || 0), 0),
      fat: meals.reduce((sum, m) => sum + Number(m.fat || 0), 0),
      fiber: meals.reduce((sum, m) => sum + Number(m.fiber || 0), 0),
      mealCount: meals.length,
    }
  },
}

// ==========================================
// Sleep Service
// ==========================================

export const sleepService = {
  async getAll(userId: string, limit = 30) {
    return prisma.sleepLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    })
  },

  async create(
    userId: string,
    data: {
      bedTime: Date
      wakeTime: Date
      quality?: number
      notes?: string
      date?: Date
    }
  ) {
    const duration = Math.round(
      (data.wakeTime.getTime() - data.bedTime.getTime()) / (1000 * 60)
    )

    return prisma.sleepLog.create({
      data: {
        userId,
        bedTime: data.bedTime,
        wakeTime: data.wakeTime,
        duration,
        quality: data.quality,
        notes: data.notes,
        date: data.date || new Date(),
      },
    })
  },

  async delete(id: string, userId: string) {
    return prisma.sleepLog.deleteMany({
      where: { id, userId },
    })
  },

  async getStats(userId: string, days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await prisma.sleepLog.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
    })

    if (logs.length === 0) {
      return { avgDuration: 0, avgQuality: 0, logs: [] }
    }

    const avgDuration = Math.round(
      logs.reduce((sum, l) => sum + l.duration, 0) / logs.length
    )
    const qualityLogs = logs.filter((l) => l.quality !== null)
    const avgQuality =
      qualityLogs.length > 0
        ? qualityLogs.reduce((sum, l) => sum + (l.quality || 0), 0) / qualityLogs.length
        : 0

    return { avgDuration, avgQuality, logs }
  },
}

// ==========================================
// Water Service
// ==========================================

export const waterService = {
  async getDailyTotal(userId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const logs = await prisma.waterLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    return {
      total: logs.reduce((sum, l) => sum + l.amount, 0),
      logs,
    }
  },

  async addWater(userId: string, amount: number) {
    return prisma.waterLog.create({
      data: {
        userId,
        amount,
      },
    })
  },
}

// ==========================================
// Health Goals Service
// ==========================================

export const healthGoalService = {
  async getAll(userId: string) {
    return prisma.healthGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async create(
    userId: string,
    data: {
      type: string
      targetValue: number
      unit: string
      deadline?: Date
    }
  ) {
    return prisma.healthGoal.create({
      data: {
        userId,
        ...data,
      },
    })
  },

  async updateProgress(id: string, userId: string, currentValue: number) {
    const goal = await prisma.healthGoal.findFirst({
      where: { id, userId },
    })

    if (!goal) return null

    const isCompleted = currentValue >= Number(goal.targetValue)

    return prisma.healthGoal.update({
      where: { id },
      data: {
        currentValue,
        isCompleted,
      },
    })
  },

  async delete(id: string, userId: string) {
    return prisma.healthGoal.deleteMany({
      where: { id, userId },
    })
  },
}

// ==========================================
// Dashboard Service
// ==========================================

export const healthDashboardService = {
  async getSummary(userId: string) {
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [
      latestWeight,
      workoutStats,
      sleepStats,
      todayNutrition,
      todayWater,
      activeGoals,
    ] = await Promise.all([
      weightService.getLatest(userId),
      workoutService.getStats(userId, 7),
      sleepService.getStats(userId, 7),
      mealService.getDailyTotals(userId, today),
      waterService.getDailyTotal(userId, today),
      prisma.healthGoal.count({ where: { userId, isCompleted: false } }),
    ])

    return {
      weight: latestWeight ? Number(latestWeight.weight) : null,
      weightUnit: latestWeight?.unit || 'kg',
      workoutsThisWeek: workoutStats.totalWorkouts,
      avgSleepHours: Math.round((sleepStats.avgDuration / 60) * 10) / 10,
      todayCalories: todayNutrition.calories,
      todayWaterMl: todayWater.total,
      activeGoals,
    }
  },
}
