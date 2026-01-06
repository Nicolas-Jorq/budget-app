import { Response } from 'express'
import { goalsService } from '../services/goals.js'
import { AuthRequest } from '../middleware/auth.js'

export const goalsController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const goals = await goalsService.getAll(req.userId!)
      res.json(goals)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch savings goals' })
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const goal = await goalsService.getById(req.params.id, req.userId!)
      if (!goal) {
        res.status(404).json({ message: 'Savings goal not found' })
        return
      }
      res.json(goal)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch savings goal' })
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, type, targetAmount, deadline, priority, icon, color, metadata } = req.body

      if (!name || !type || targetAmount === undefined) {
        res.status(400).json({ message: 'Name, type, and targetAmount are required' })
        return
      }

      const goal = await goalsService.create(req.userId!, {
        name,
        type,
        targetAmount,
        deadline,
        priority,
        icon,
        color,
        metadata,
      })
      res.status(201).json(goal)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create savings goal'
      res.status(400).json({ message })
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const goal = await goalsService.update(req.params.id, req.userId!, req.body)
      res.json(goal)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update savings goal'
      res.status(400).json({ message })
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await goalsService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete savings goal'
      res.status(400).json({ message })
    }
  },

  // Contribution endpoints
  async addContribution(req: AuthRequest, res: Response) {
    try {
      const { amount, note, transactionId } = req.body

      if (amount === undefined || amount <= 0) {
        res.status(400).json({ message: 'A positive amount is required' })
        return
      }

      const contribution = await goalsService.addContribution(req.params.id, req.userId!, {
        amount,
        note,
        transactionId,
      })
      res.status(201).json(contribution)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add contribution'
      res.status(400).json({ message })
    }
  },

  async removeContribution(req: AuthRequest, res: Response) {
    try {
      await goalsService.removeContribution(req.params.contributionId, req.userId!)
      res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove contribution'
      res.status(400).json({ message })
    }
  },

  async getContributions(req: AuthRequest, res: Response) {
    try {
      const contributions = await goalsService.getContributions(req.params.id, req.userId!)
      res.json(contributions)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contributions'
      res.status(400).json({ message })
    }
  },

  // Summary for dashboard
  async getSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await goalsService.getSummary(req.userId!)
      res.json(summary)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch goals summary' })
    }
  },
}
