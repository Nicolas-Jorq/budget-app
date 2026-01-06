import { GoalType, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('goals-service')

export interface CreateGoalInput {
  name: string
  type: GoalType
  targetAmount: number
  deadline?: string
  priority?: number
  icon?: string
  color?: string
  metadata?: Record<string, unknown>
}

export interface UpdateGoalInput {
  name?: string
  type?: GoalType
  targetAmount?: number
  deadline?: string | null
  priority?: number
  icon?: string
  color?: string
  metadata?: Record<string, unknown>
  isCompleted?: boolean
}

export interface CreateContributionInput {
  amount: number
  note?: string
  transactionId?: string
}

export const goalsService = {
  async getAll(userId: string) {
    logger.debug('Fetching all savings goals', { userId })
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      include: {
        contributions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { contributions: true },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })
    logger.debug('Savings goals fetched', { userId, count: goals.length })
    return goals
  },

  async getById(id: string, userId: string) {
    logger.debug('Fetching savings goal by ID', { goalId: id, userId })
    return prisma.savingsGoal.findFirst({
      where: { id, userId },
      include: {
        contributions: {
          orderBy: { createdAt: 'desc' },
          include: {
            transaction: {
              select: { id: true, description: true, date: true },
            },
          },
        },
      },
    })
  },

  async create(userId: string, data: CreateGoalInput) {
    logger.info('Creating savings goal', {
      userId,
      name: data.name,
      type: data.type,
      targetAmount: data.targetAmount,
    })

    const goal = await prisma.savingsGoal.create({
      data: {
        name: data.name,
        type: data.type,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline) : null,
        priority: data.priority ?? 1,
        icon: data.icon,
        color: data.color,
        metadata: data.metadata as Prisma.JsonObject | undefined,
        userId,
      },
    })

    logger.info('Savings goal created', { goalId: goal.id, userId })
    return goal
  },

  async update(id: string, userId: string, data: UpdateGoalInput) {
    logger.info('Updating savings goal', { goalId: id, userId, updates: data })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    })

    if (!goal) {
      logger.warn('Savings goal not found for update', { goalId: id, userId })
      throw new Error('Savings goal not found')
    }

    const updateData: Prisma.SavingsGoalUpdateInput = {
      ...data,
      deadline: data.deadline === null ? null : data.deadline ? new Date(data.deadline) : undefined,
      metadata: data.metadata as Prisma.JsonObject | undefined,
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: updateData,
    })

    logger.info('Savings goal updated', { goalId: id, userId })
    return updated
  },

  async delete(id: string, userId: string) {
    logger.info('Deleting savings goal', { goalId: id, userId })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    })

    if (!goal) {
      logger.warn('Savings goal not found for deletion', { goalId: id, userId })
      throw new Error('Savings goal not found')
    }

    await prisma.savingsGoal.delete({
      where: { id },
    })

    logger.info('Savings goal deleted', { goalId: id, userId })
    return goal
  },

  // Contribution methods
  async addContribution(goalId: string, userId: string, data: CreateContributionInput) {
    logger.info('Adding contribution to goal', {
      goalId,
      userId,
      amount: data.amount,
    })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    })

    if (!goal) {
      logger.warn('Savings goal not found for contribution', { goalId, userId })
      throw new Error('Savings goal not found')
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create contribution
      const contribution = await tx.contribution.create({
        data: {
          amount: data.amount,
          note: data.note,
          goalId,
          transactionId: data.transactionId,
        },
      })

      // Update goal's current amount
      const newAmount = Number(goal.currentAmount) + data.amount
      const isNowCompleted = newAmount >= Number(goal.targetAmount)

      await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newAmount,
          isCompleted: isNowCompleted,
        },
      })

      return contribution
    })

    logger.info('Contribution added', {
      contributionId: result.id,
      goalId,
      amount: data.amount,
    })

    return result
  },

  async removeContribution(contributionId: string, userId: string) {
    logger.info('Removing contribution', { contributionId, userId })

    const contribution = await prisma.contribution.findFirst({
      where: { id: contributionId },
      include: { goal: true },
    })

    if (!contribution || contribution.goal.userId !== userId) {
      logger.warn('Contribution not found or unauthorized', { contributionId, userId })
      throw new Error('Contribution not found')
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete contribution
      await tx.contribution.delete({
        where: { id: contributionId },
      })

      // Update goal's current amount
      const newAmount = Math.max(0, Number(contribution.goal.currentAmount) - Number(contribution.amount))

      await tx.savingsGoal.update({
        where: { id: contribution.goalId },
        data: {
          currentAmount: newAmount,
          isCompleted: newAmount >= Number(contribution.goal.targetAmount),
        },
      })
    })

    logger.info('Contribution removed', { contributionId, goalId: contribution.goalId })
    return contribution
  },

  async getContributions(goalId: string, userId: string) {
    logger.debug('Fetching contributions for goal', { goalId, userId })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    })

    if (!goal) {
      logger.warn('Savings goal not found', { goalId, userId })
      throw new Error('Savings goal not found')
    }

    return prisma.contribution.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          select: { id: true, description: true, date: true, amount: true },
        },
      },
    })
  },

  // Summary for dashboard
  async getSummary(userId: string) {
    logger.debug('Fetching goals summary', { userId })

    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        targetAmount: true,
        currentAmount: true,
        deadline: true,
        isCompleted: true,
        color: true,
        icon: true,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })

    const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0)
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0)
    const completedCount = goals.filter((g) => g.isCompleted).length
    const activeCount = goals.filter((g) => !g.isCompleted).length

    return {
      goals,
      totalTarget,
      totalSaved,
      completedCount,
      activeCount,
      overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
    }
  },
}
