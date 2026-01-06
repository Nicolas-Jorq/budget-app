/**
 * @fileoverview Life Goals Module Service
 *
 * Business logic for life goals and milestones.
 *
 * @module modules/life-goals/life-goals-service
 */

import { PrismaClient, LifeGoalCategory, LifeGoalStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ==========================================
// Life Goal Service
// ==========================================

export const lifeGoalService = {
  /**
   * Get all life goals for a user with optional filters.
   */
  async getGoals(
    userId: string,
    options?: {
      category?: LifeGoalCategory
      status?: LifeGoalStatus
      includeCompleted?: boolean
    }
  ) {
    const where: Record<string, unknown> = { userId }

    if (options?.category) {
      where.category = options.category
    }

    if (options?.status) {
      where.status = options.status
    } else if (!options?.includeCompleted) {
      where.status = { notIn: ['COMPLETED', 'ABANDONED'] }
    }

    return prisma.lifeGoal.findMany({
      where,
      include: {
        milestones: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { milestones: true },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { targetDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })
  },

  /**
   * Get a single life goal by ID.
   */
  async getGoal(userId: string, goalId: string) {
    return prisma.lifeGoal.findFirst({
      where: { id: goalId, userId },
      include: {
        milestones: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  },

  /**
   * Create a new life goal.
   */
  async createGoal(
    userId: string,
    data: {
      title: string
      description?: string
      category: LifeGoalCategory
      targetDate?: Date
      priority?: number
      imageUrl?: string
      notes?: string
    }
  ) {
    return prisma.lifeGoal.create({
      data: {
        ...data,
        userId,
      },
      include: {
        milestones: true,
      },
    })
  },

  /**
   * Update a life goal.
   */
  async updateGoal(
    userId: string,
    goalId: string,
    data: {
      title?: string
      description?: string
      category?: LifeGoalCategory
      status?: LifeGoalStatus
      targetDate?: Date | null
      priority?: number
      imageUrl?: string | null
      notes?: string | null
    }
  ) {
    // Handle status change - set completedAt when marking COMPLETED, clear it otherwise
    const updateData: Record<string, unknown> = { ...data }
    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    } else if (data.status) {
      // Status changed to something other than COMPLETED, clear completedAt
      updateData.completedAt = null
    }

    return prisma.lifeGoal.update({
      where: { id: goalId, userId },
      data: updateData,
      include: {
        milestones: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  },

  /**
   * Delete a life goal.
   */
  async deleteGoal(userId: string, goalId: string) {
    return prisma.lifeGoal.delete({
      where: { id: goalId, userId },
    })
  },

  /**
   * Get goals by category for dashboard display.
   */
  async getGoalsByCategory(userId: string) {
    const goals = await prisma.lifeGoal.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ABANDONED'] },
      },
      select: {
        category: true,
      },
    })

    const counts: Record<string, number> = {}
    for (const goal of goals) {
      counts[goal.category] = (counts[goal.category] || 0) + 1
    }

    return counts
  },
}

// ==========================================
// Milestone Service
// ==========================================

export const milestoneService = {
  /**
   * Create a milestone for a goal.
   */
  async createMilestone(
    userId: string,
    goalId: string,
    data: {
      title: string
      description?: string
      targetDate?: Date
    }
  ) {
    // Verify goal belongs to user
    const goal = await prisma.lifeGoal.findFirst({
      where: { id: goalId, userId },
    })
    if (!goal) {
      throw new Error('Goal not found')
    }

    // Get max sort order
    const maxOrder = await prisma.lifeMilestone.aggregate({
      where: { goalId },
      _max: { sortOrder: true },
    })

    return prisma.lifeMilestone.create({
      data: {
        ...data,
        goalId,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    })
  },

  /**
   * Update a milestone.
   */
  async updateMilestone(
    userId: string,
    milestoneId: string,
    data: {
      title?: string
      description?: string
      isCompleted?: boolean
      targetDate?: Date | null
    }
  ) {
    // Verify milestone belongs to user's goal
    const milestone = await prisma.lifeMilestone.findFirst({
      where: { id: milestoneId },
      include: { goal: { select: { userId: true } } },
    })
    if (!milestone || milestone.goal.userId !== userId) {
      throw new Error('Milestone not found')
    }

    const updateData: Record<string, unknown> = { ...data }
    if (data.isCompleted === true) {
      updateData.completedAt = new Date()
    } else if (data.isCompleted === false) {
      updateData.completedAt = null
    }

    return prisma.lifeMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    })
  },

  /**
   * Toggle milestone completion.
   */
  async toggleMilestone(userId: string, milestoneId: string) {
    const milestone = await prisma.lifeMilestone.findFirst({
      where: { id: milestoneId },
      include: { goal: { select: { userId: true } } },
    })
    if (!milestone || milestone.goal.userId !== userId) {
      throw new Error('Milestone not found')
    }

    return prisma.lifeMilestone.update({
      where: { id: milestoneId },
      data: {
        isCompleted: !milestone.isCompleted,
        completedAt: milestone.isCompleted ? null : new Date(),
      },
    })
  },

  /**
   * Delete a milestone.
   */
  async deleteMilestone(userId: string, milestoneId: string) {
    const milestone = await prisma.lifeMilestone.findFirst({
      where: { id: milestoneId },
      include: { goal: { select: { userId: true } } },
    })
    if (!milestone || milestone.goal.userId !== userId) {
      throw new Error('Milestone not found')
    }

    return prisma.lifeMilestone.delete({
      where: { id: milestoneId },
    })
  },
}

// ==========================================
// Dashboard Service
// ==========================================

export const lifeGoalsDashboardService = {
  /**
   * Get life goals dashboard summary.
   */
  async getDashboardSummary(userId: string) {
    const [
      totalGoals,
      inProgressGoals,
      completedGoals,
      goalsByCategory,
      upcomingMilestones,
      recentlyCompleted,
    ] = await Promise.all([
      // Total active goals
      prisma.lifeGoal.count({
        where: {
          userId,
          status: { notIn: ['COMPLETED', 'ABANDONED'] },
        },
      }),
      // In progress
      prisma.lifeGoal.count({
        where: { userId, status: 'IN_PROGRESS' },
      }),
      // Completed goals
      prisma.lifeGoal.count({
        where: { userId, status: 'COMPLETED' },
      }),
      // Goals by category
      lifeGoalService.getGoalsByCategory(userId),
      // Upcoming milestones (next 30 days)
      prisma.lifeMilestone.count({
        where: {
          goal: { userId },
          isCompleted: false,
          targetDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Recently completed milestones (last 7 days)
      prisma.lifeMilestone.count({
        where: {
          goal: { userId },
          isCompleted: true,
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    return {
      totalGoals,
      inProgressGoals,
      completedGoals,
      goalsByCategory,
      upcomingMilestones,
      recentlyCompleted,
    }
  },
}
