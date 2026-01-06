import { Response } from 'express'
import { budgetService } from '../services/budgets.js'
import { AuthRequest } from '../middleware/auth.js'

export const budgetController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const budgets = await budgetService.getAll(req.userId!)
      res.json(budgets)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budgets' })
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const budget = await budgetService.getById(req.params.id, req.userId!)
      if (!budget) {
        res.status(404).json({ message: 'Budget not found' })
        return
      }
      res.json(budget)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budget' })
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, amount, category } = req.body

      if (!name || amount === undefined || !category) {
        res.status(400).json({ message: 'Name, amount, and category are required' })
        return
      }

      const budget = await budgetService.create(req.userId!, { name, amount, category })
      res.status(201).json(budget)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create budget'
      res.status(400).json({ message })
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const budget = await budgetService.update(req.params.id, req.userId!, req.body)
      res.json(budget)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update budget'
      res.status(400).json({ message })
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await budgetService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete budget'
      res.status(400).json({ message })
    }
  },
}
