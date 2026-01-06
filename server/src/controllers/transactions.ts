import { Response } from 'express'
import { transactionService } from '../services/transactions.js'
import { AuthRequest } from '../middleware/auth.js'

export const transactionController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const transactions = await transactionService.getAll(req.userId!)
      res.json(transactions)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch transactions' })
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const transaction = await transactionService.getById(req.params.id, req.userId!)
      if (!transaction) {
        res.status(404).json({ message: 'Transaction not found' })
        return
      }
      res.json(transaction)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch transaction' })
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { description, amount, type, category, date, budgetId } = req.body

      if (!description || amount === undefined || !type || !category || !date) {
        res.status(400).json({ message: 'Description, amount, type, category, and date are required' })
        return
      }

      if (type !== 'income' && type !== 'expense') {
        res.status(400).json({ message: 'Type must be income or expense' })
        return
      }

      const transaction = await transactionService.create(req.userId!, {
        description,
        amount,
        type,
        category,
        date,
        budgetId,
      })
      res.status(201).json(transaction)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create transaction'
      res.status(400).json({ message })
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const transaction = await transactionService.update(req.params.id, req.userId!, req.body)
      res.json(transaction)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update transaction'
      res.status(400).json({ message })
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await transactionService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete transaction'
      res.status(400).json({ message })
    }
  },
}
