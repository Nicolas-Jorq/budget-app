import { Request, Response } from 'express'
import { authService } from '../services/auth.js'
import { AuthRequest } from '../middleware/auth.js'

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, name, password } = req.body

      if (!email || !name || !password) {
        res.status(400).json({ message: 'Email, name, and password are required' })
        return
      }

      if (password.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters' })
        return
      }

      const result = await authService.register({ email, name, password })
      res.status(201).json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      res.status(400).json({ message })
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' })
        return
      }

      const result = await authService.login({ email, password })
      res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      res.status(401).json({ message })
    }
  },

  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        res.status(401).json({ message: 'Not authenticated' })
        return
      }

      const user = await authService.getUser(req.userId)
      if (!user) {
        res.status(404).json({ message: 'User not found' })
        return
      }

      res.json(user)
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user' })
    }
  },
}
