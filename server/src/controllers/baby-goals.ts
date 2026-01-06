import { Response } from 'express'
import { babyGoalsService } from '../services/baby-goals.js'
import { AuthRequest } from '../middleware/auth.js'

export const babyGoalsController = {
  // Milestones CRUD
  async getMilestones(req: AuthRequest, res: Response) {
    try {
      const milestones = await babyGoalsService.getMilestones(req.params.goalId, req.userId!)
      res.json(milestones)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch milestones'
      res.status(400).json({ message })
    }
  },

  async getMilestoneById(req: AuthRequest, res: Response) {
    try {
      const milestone = await babyGoalsService.getMilestoneById(req.params.milestoneId, req.userId!)
      res.json(milestone)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch milestone'
      res.status(400).json({ message })
    }
  },

  async createMilestone(req: AuthRequest, res: Response) {
    try {
      const { name, category, targetAmount, dueMonth, notes } = req.body

      if (!name || !category || targetAmount === undefined) {
        res.status(400).json({ message: 'Name, category, and targetAmount are required' })
        return
      }

      if (targetAmount <= 0) {
        res.status(400).json({ message: 'Target amount must be positive' })
        return
      }

      const milestone = await babyGoalsService.createMilestone(req.params.goalId, req.userId!, {
        name,
        category,
        targetAmount,
        dueMonth,
        notes,
      })
      res.status(201).json(milestone)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create milestone'
      res.status(400).json({ message })
    }
  },

  async updateMilestone(req: AuthRequest, res: Response) {
    try {
      const milestone = await babyGoalsService.updateMilestone(
        req.params.milestoneId,
        req.userId!,
        req.body
      )
      res.json(milestone)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update milestone'
      res.status(400).json({ message })
    }
  },

  async deleteMilestone(req: AuthRequest, res: Response) {
    try {
      await babyGoalsService.deleteMilestone(req.params.milestoneId, req.userId!)
      res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete milestone'
      res.status(400).json({ message })
    }
  },

  // Contribute to specific milestone
  async contributeToMilestone(req: AuthRequest, res: Response) {
    try {
      const { amount, note } = req.body

      if (amount === undefined || amount <= 0) {
        res.status(400).json({ message: 'A positive amount is required' })
        return
      }

      const milestone = await babyGoalsService.contributeToMilestone(
        req.params.milestoneId,
        req.userId!,
        amount,
        note
      )
      res.json(milestone)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to contribute to milestone'
      res.status(400).json({ message })
    }
  },

  // Projections and timeline
  async getProjections(req: AuthRequest, res: Response) {
    try {
      const projections = await babyGoalsService.getProjections(req.params.goalId, req.userId!)
      res.json(projections)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get projections'
      res.status(400).json({ message })
    }
  },

  async getTimeline(req: AuthRequest, res: Response) {
    try {
      const timeline = await babyGoalsService.getTimeline(req.params.goalId, req.userId!)
      res.json(timeline)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get timeline'
      res.status(400).json({ message })
    }
  },

  // Create default milestones
  async createDefaultMilestones(req: AuthRequest, res: Response) {
    try {
      const milestones = await babyGoalsService.createDefaultMilestones(req.params.goalId, req.userId!)
      res.status(201).json(milestones)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create default milestones'
      res.status(400).json({ message })
    }
  },
}
