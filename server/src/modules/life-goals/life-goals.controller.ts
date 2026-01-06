/**
 * @fileoverview Life Goals Module Controller
 *
 * HTTP request handlers for life goals and milestones.
 *
 * @module modules/life-goals/life-goals-controller
 */

import { Response } from 'express'
import { LifeGoalCategory, LifeGoalStatus } from '@prisma/client'
import { AuthRequest } from '../../middleware/auth.js'
import {
  lifeGoalService,
  milestoneService,
  lifeGoalsDashboardService,
} from './life-goals.service.js'

// ==========================================
// Dashboard Controller
// ==========================================

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const summary = await lifeGoalsDashboardService.getDashboardSummary(userId)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching life goals dashboard:', error)
    res.status(500).json({ message: 'Failed to fetch dashboard summary' })
  }
}

// ==========================================
// Life Goal Controllers
// ==========================================

export async function getGoals(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { category, status, includeCompleted } = req.query

    const goals = await lifeGoalService.getGoals(userId, {
      category: category as LifeGoalCategory | undefined,
      status: status as LifeGoalStatus | undefined,
      includeCompleted: includeCompleted === 'true',
    })

    res.json(goals)
  } catch (error) {
    console.error('Error fetching life goals:', error)
    res.status(500).json({ message: 'Failed to fetch goals' })
  }
}

export async function getGoal(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    const goal = await lifeGoalService.getGoal(userId, id)

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' })
    }

    res.json(goal)
  } catch (error) {
    console.error('Error fetching life goal:', error)
    res.status(500).json({ message: 'Failed to fetch goal' })
  }
}

export async function createGoal(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { title, description, category, targetDate, priority, imageUrl, notes } =
      req.body

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required' })
    }

    const goal = await lifeGoalService.createGoal(userId, {
      title,
      description,
      category,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      priority,
      imageUrl,
      notes,
    })

    res.status(201).json(goal)
  } catch (error) {
    console.error('Error creating life goal:', error)
    res.status(500).json({ message: 'Failed to create goal' })
  }
}

export async function updateGoal(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params
    const { title, description, category, status, targetDate, priority, imageUrl, notes } =
      req.body

    const goal = await lifeGoalService.updateGoal(userId, id, {
      title,
      description,
      category,
      status,
      targetDate: targetDate === null ? null : targetDate ? new Date(targetDate) : undefined,
      priority,
      imageUrl,
      notes,
    })

    res.json(goal)
  } catch (error) {
    console.error('Error updating life goal:', error)
    res.status(500).json({ message: 'Failed to update goal' })
  }
}

export async function deleteGoal(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    await lifeGoalService.deleteGoal(userId, id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting life goal:', error)
    res.status(500).json({ message: 'Failed to delete goal' })
  }
}

// ==========================================
// Milestone Controllers
// ==========================================

export async function createMilestone(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { goalId } = req.params
    const { title, description, targetDate } = req.body

    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    const milestone = await milestoneService.createMilestone(userId, goalId, {
      title,
      description,
      targetDate: targetDate ? new Date(targetDate) : undefined,
    })

    res.status(201).json(milestone)
  } catch (error) {
    console.error('Error creating milestone:', error)
    res.status(500).json({ message: 'Failed to create milestone' })
  }
}

export async function updateMilestone(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params
    const { title, description, isCompleted, targetDate } = req.body

    const milestone = await milestoneService.updateMilestone(userId, id, {
      title,
      description,
      isCompleted,
      targetDate: targetDate === null ? null : targetDate ? new Date(targetDate) : undefined,
    })

    res.json(milestone)
  } catch (error) {
    console.error('Error updating milestone:', error)
    res.status(500).json({ message: 'Failed to update milestone' })
  }
}

export async function toggleMilestone(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    const milestone = await milestoneService.toggleMilestone(userId, id)
    res.json(milestone)
  } catch (error) {
    console.error('Error toggling milestone:', error)
    res.status(500).json({ message: 'Failed to toggle milestone' })
  }
}

export async function deleteMilestone(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    await milestoneService.deleteMilestone(userId, id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting milestone:', error)
    res.status(500).json({ message: 'Failed to delete milestone' })
  }
}
