import { MilestoneCategory, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('baby-goals-service')

export interface CreateMilestoneInput {
  name: string
  category: MilestoneCategory
  targetAmount: number
  dueMonth?: number
  notes?: string
}

export interface UpdateMilestoneInput {
  name?: string
  category?: MilestoneCategory
  targetAmount?: number
  dueMonth?: number | null
  notes?: string | null
  isCompleted?: boolean
}

export interface BabyGoalMetadata {
  babyName?: string
  expectedDueDate?: string
  actualBirthDate?: string
  isPregnancy: boolean
}

// Default expense estimates by category
export const DEFAULT_EXPENSE_ESTIMATES: Record<MilestoneCategory, { label: string; defaultAmount: number; defaultDueMonth: number }> = {
  PRE_BIRTH: { label: 'Pre-Birth Expenses', defaultAmount: 2500, defaultDueMonth: -3 },
  NURSERY: { label: 'Nursery Setup', defaultAmount: 2000, defaultDueMonth: -1 },
  GEAR: { label: 'Baby Gear & Equipment', defaultAmount: 1500, defaultDueMonth: 0 },
  FIRST_YEAR: { label: 'First Year Essentials', defaultAmount: 3000, defaultDueMonth: 6 },
  CHILDCARE: { label: 'Childcare', defaultAmount: 12000, defaultDueMonth: 3 },
  HEALTHCARE: { label: 'Healthcare & Insurance', defaultAmount: 2000, defaultDueMonth: 0 },
  EDUCATION: { label: 'Education Fund', defaultAmount: 5000, defaultDueMonth: 12 },
}

export const babyGoalsService = {
  // Verify goal exists and belongs to user
  async verifyGoalOwnership(goalId: string, userId: string) {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'BABY' },
    })
    if (!goal) {
      throw new Error('Baby goal not found')
    }
    return goal
  },

  // Get all milestones for a baby goal
  async getMilestones(goalId: string, userId: string) {
    logger.debug('Fetching milestones for baby goal', { goalId, userId })

    await this.verifyGoalOwnership(goalId, userId)

    const milestones = await prisma.babyMilestone.findMany({
      where: { goalId },
      orderBy: [{ dueMonth: 'asc' }, { createdAt: 'asc' }],
    })

    logger.debug('Milestones fetched', { goalId, count: milestones.length })
    return milestones
  },

  // Get a single milestone
  async getMilestoneById(milestoneId: string, userId: string) {
    logger.debug('Fetching milestone by ID', { milestoneId, userId })

    const milestone = await prisma.babyMilestone.findFirst({
      where: { id: milestoneId },
      include: { goal: true },
    })

    if (!milestone || milestone.goal.userId !== userId) {
      throw new Error('Milestone not found')
    }

    return milestone
  },

  // Create a milestone
  async createMilestone(goalId: string, userId: string, data: CreateMilestoneInput) {
    logger.info('Creating baby milestone', { goalId, userId, name: data.name, category: data.category })

    await this.verifyGoalOwnership(goalId, userId)

    const milestone = await prisma.babyMilestone.create({
      data: {
        goalId,
        name: data.name,
        category: data.category,
        targetAmount: data.targetAmount,
        dueMonth: data.dueMonth ?? DEFAULT_EXPENSE_ESTIMATES[data.category].defaultDueMonth,
        notes: data.notes,
      },
    })

    logger.info('Baby milestone created', { milestoneId: milestone.id, goalId })
    return milestone
  },

  // Update a milestone
  async updateMilestone(milestoneId: string, userId: string, data: UpdateMilestoneInput) {
    logger.info('Updating baby milestone', { milestoneId, userId, updates: data })

    const milestone = await prisma.babyMilestone.findFirst({
      where: { id: milestoneId },
      include: { goal: true },
    })

    if (!milestone || milestone.goal.userId !== userId) {
      logger.warn('Milestone not found for update', { milestoneId, userId })
      throw new Error('Milestone not found')
    }

    const updateData: Prisma.BabyMilestoneUpdateInput = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount
    if (data.dueMonth !== undefined) updateData.dueMonth = data.dueMonth
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted

    const updated = await prisma.babyMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    })

    logger.info('Baby milestone updated', { milestoneId })
    return updated
  },

  // Delete a milestone
  async deleteMilestone(milestoneId: string, userId: string) {
    logger.info('Deleting baby milestone', { milestoneId, userId })

    const milestone = await prisma.babyMilestone.findFirst({
      where: { id: milestoneId },
      include: { goal: true },
    })

    if (!milestone || milestone.goal.userId !== userId) {
      logger.warn('Milestone not found for deletion', { milestoneId, userId })
      throw new Error('Milestone not found')
    }

    await prisma.babyMilestone.delete({
      where: { id: milestoneId },
    })

    logger.info('Baby milestone deleted', { milestoneId, goalId: milestone.goalId })
    return milestone
  },

  // Contribute to a specific milestone
  async contributeToMilestone(milestoneId: string, userId: string, amount: number, note?: string) {
    logger.info('Contributing to milestone', { milestoneId, userId, amount })

    const milestone = await prisma.babyMilestone.findFirst({
      where: { id: milestoneId },
      include: { goal: true },
    })

    if (!milestone || milestone.goal.userId !== userId) {
      throw new Error('Milestone not found')
    }

    // Use transaction to update both milestone and parent goal
    const result = await prisma.$transaction(async (tx) => {
      const newMilestoneAmount = Number(milestone.currentAmount) + amount
      const isMilestoneCompleted = newMilestoneAmount >= Number(milestone.targetAmount)

      // Update milestone
      const updatedMilestone = await tx.babyMilestone.update({
        where: { id: milestoneId },
        data: {
          currentAmount: newMilestoneAmount,
          isCompleted: isMilestoneCompleted,
        },
      })

      // Update parent goal's current amount
      const newGoalAmount = Number(milestone.goal.currentAmount) + amount
      const isGoalCompleted = newGoalAmount >= Number(milestone.goal.targetAmount)

      await tx.savingsGoal.update({
        where: { id: milestone.goalId },
        data: {
          currentAmount: newGoalAmount,
          isCompleted: isGoalCompleted,
        },
      })

      // Create a contribution record on the parent goal
      await tx.contribution.create({
        data: {
          amount,
          note: note ?? `Contribution to ${milestone.name}`,
          goalId: milestone.goalId,
        },
      })

      return updatedMilestone
    })

    logger.info('Milestone contribution added', { milestoneId, amount, newAmount: result.currentAmount })
    return result
  },

  // Get expense projections based on due date
  async getProjections(goalId: string, userId: string) {
    logger.debug('Calculating expense projections', { goalId, userId })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'BABY' },
      include: { babyMilestones: true },
    })

    if (!goal) {
      throw new Error('Baby goal not found')
    }

    const metadata = goal.metadata as BabyGoalMetadata | null
    const dueDate = metadata?.expectedDueDate || metadata?.actualBirthDate

    // Calculate current month relative to due date
    let currentMonthFromBirth = 0
    if (dueDate) {
      const dueDateObj = new Date(dueDate)
      const now = new Date()
      const monthsDiff = (now.getFullYear() - dueDateObj.getFullYear()) * 12 +
                         (now.getMonth() - dueDateObj.getMonth())
      currentMonthFromBirth = monthsDiff
    }

    // Build projections based on milestones and defaults
    const projections = Object.entries(DEFAULT_EXPENSE_ESTIMATES).map(([category, defaults]) => {
      const existingMilestone = goal.babyMilestones.find(m => m.category === category)

      return {
        category: category as MilestoneCategory,
        label: defaults.label,
        estimatedCost: existingMilestone ? Number(existingMilestone.targetAmount) : defaults.defaultAmount,
        currentSaved: existingMilestone ? Number(existingMilestone.currentAmount) : 0,
        dueMonth: existingMilestone?.dueMonth ?? defaults.defaultDueMonth,
        isOverdue: (existingMilestone?.dueMonth ?? defaults.defaultDueMonth) < currentMonthFromBirth,
        hasExistingMilestone: !!existingMilestone,
        percentComplete: existingMilestone
          ? Math.round((Number(existingMilestone.currentAmount) / Number(existingMilestone.targetAmount)) * 100)
          : 0,
      }
    })

    const totalProjected = projections.reduce((sum, p) => sum + p.estimatedCost, 0)
    const totalSaved = projections.reduce((sum, p) => sum + p.currentSaved, 0)

    return {
      projections,
      totalProjected,
      totalSaved,
      shortfall: Math.max(0, totalProjected - totalSaved),
      percentComplete: totalProjected > 0 ? Math.round((totalSaved / totalProjected) * 100) : 0,
      currentMonthFromBirth,
      dueDate,
    }
  },

  // Get timeline view combining milestones with due months
  async getTimeline(goalId: string, userId: string) {
    logger.debug('Building timeline for baby goal', { goalId, userId })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'BABY' },
      include: {
        babyMilestones: {
          orderBy: { dueMonth: 'asc' },
        },
      },
    })

    if (!goal) {
      throw new Error('Baby goal not found')
    }

    const metadata = goal.metadata as BabyGoalMetadata | null
    const dueDate = metadata?.expectedDueDate || metadata?.actualBirthDate

    // Group milestones by phase
    const phases = [
      { name: 'Pre-Birth', range: [-9, -1], milestones: [] as typeof goal.babyMilestones },
      { name: 'Birth', range: [0, 0], milestones: [] as typeof goal.babyMilestones },
      { name: 'First 6 Months', range: [1, 6], milestones: [] as typeof goal.babyMilestones },
      { name: '6-12 Months', range: [7, 12], milestones: [] as typeof goal.babyMilestones },
      { name: 'Year 2', range: [13, 24], milestones: [] as typeof goal.babyMilestones },
      { name: 'Year 3+', range: [25, 999], milestones: [] as typeof goal.babyMilestones },
    ]

    goal.babyMilestones.forEach(milestone => {
      const month = milestone.dueMonth ?? 0
      const phase = phases.find(p => month >= p.range[0] && month <= p.range[1])
      if (phase) {
        phase.milestones.push(milestone)
      }
    })

    // Filter out empty phases
    const timelinePhases = phases
      .filter(p => p.milestones.length > 0)
      .map(p => ({
        name: p.name,
        milestones: p.milestones.map(m => ({
          id: m.id,
          name: m.name,
          category: m.category,
          targetAmount: Number(m.targetAmount),
          currentAmount: Number(m.currentAmount),
          isCompleted: m.isCompleted,
          dueMonth: m.dueMonth,
          percentComplete: Number(m.targetAmount) > 0
            ? Math.round((Number(m.currentAmount) / Number(m.targetAmount)) * 100)
            : 0,
        })),
        totalTarget: p.milestones.reduce((sum, m) => sum + Number(m.targetAmount), 0),
        totalSaved: p.milestones.reduce((sum, m) => sum + Number(m.currentAmount), 0),
      }))

    return {
      goalId,
      goalName: goal.name,
      dueDate,
      isPregnancy: metadata?.isPregnancy ?? true,
      babyName: metadata?.babyName,
      phases: timelinePhases,
      totalMilestones: goal.babyMilestones.length,
      completedMilestones: goal.babyMilestones.filter(m => m.isCompleted).length,
    }
  },

  // Create default milestones for a new baby goal
  async createDefaultMilestones(goalId: string, userId: string) {
    logger.info('Creating default milestones for baby goal', { goalId, userId })

    await this.verifyGoalOwnership(goalId, userId)

    const defaultMilestones = Object.entries(DEFAULT_EXPENSE_ESTIMATES).map(([category, defaults]) => ({
      goalId,
      name: defaults.label,
      category: category as MilestoneCategory,
      targetAmount: defaults.defaultAmount,
      dueMonth: defaults.defaultDueMonth,
    }))

    const milestones = await prisma.babyMilestone.createMany({
      data: defaultMilestones,
    })

    logger.info('Default milestones created', { goalId, count: milestones.count })

    return prisma.babyMilestone.findMany({
      where: { goalId },
      orderBy: { dueMonth: 'asc' },
    })
  },
}
