import { Response } from 'express'
import { dashboardService } from '../services/dashboard.js'
import { AuthRequest } from '../middleware/auth.js'

export const dashboardController = {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await dashboardService.getStats(req.userId!)
      res.json(stats)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard stats' })
    }
  },

  async getChartData(req: AuthRequest, res: Response) {
    try {
      const chartData = await dashboardService.getChartData(req.userId!)
      res.json(chartData)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chart data' })
    }
  },
}
