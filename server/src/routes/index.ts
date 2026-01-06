import { Router } from 'express'
import authRoutes from './auth.js'
import budgetRoutes from './budgets.js'
import transactionRoutes from './transactions.js'
import dashboardRoutes from './dashboard.js'
import goalsRoutes from './goals.js'
import houseRoutes from './house.js'

const router = Router()

// API root
router.get('/', (_req, res) => {
  res.json({
    message: 'Budget App API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      budgets: '/api/budgets',
      transactions: '/api/transactions',
      dashboard: '/api/dashboard',
      goals: '/api/goals',
      house: '/api/house',
    },
  })
})

// Routes
router.use('/auth', authRoutes)
router.use('/budgets', budgetRoutes)
router.use('/transactions', transactionRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/goals', goalsRoutes)
router.use('/house', houseRoutes)

export default router
