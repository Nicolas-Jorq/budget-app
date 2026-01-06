import { Response } from 'express'
import { bankAccountService } from '../services/bank-accounts.js'
import { AuthRequest } from '../middleware/auth.js'

export const bankAccountController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const accounts = await bankAccountService.getAll(req.userId!)
      res.json(accounts)
    } catch (error) {
      console.error('Bank accounts error:', error)
      res.status(500).json({ message: 'Failed to fetch bank accounts' })
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const account = await bankAccountService.getById(req.params.id, req.userId!)
      if (!account) {
        res.status(404).json({ message: 'Bank account not found' })
        return
      }
      res.json(account)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bank account' })
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, bankName, accountType, lastFour } = req.body

      if (!name || !bankName || !accountType) {
        res.status(400).json({ message: 'Name, bankName, and accountType are required' })
        return
      }

      const account = await bankAccountService.create(req.userId!, {
        name,
        bankName,
        accountType,
        lastFour
      })
      res.status(201).json(account)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create bank account'
      res.status(400).json({ message })
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const account = await bankAccountService.update(req.params.id, req.userId!, req.body)
      res.json(account)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update bank account'
      res.status(400).json({ message })
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await bankAccountService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete bank account'
      res.status(400).json({ message })
    }
  }
}
