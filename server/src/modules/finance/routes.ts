/**
 * @fileoverview Finance Module Routes
 *
 * Aggregates all finance-related routes under /api/finance namespace.
 * This provides a clean separation for the multi-module architecture.
 *
 * Route structure:
 * - /api/finance/budgets/* - Budget management
 * - /api/finance/categories/* - Category management
 * - /api/finance/transactions/* - Transaction tracking
 * - /api/finance/recurring/* - Recurring transactions
 * - /api/finance/goals/* - Savings goals
 * - /api/finance/bank-accounts/* - Bank account management
 * - /api/finance/documents/* - Bank statement documents
 * - /api/finance/house/* - House savings features
 * - /api/finance/dashboard/* - Finance dashboard stats
 *
 * @module modules/finance/routes
 */

import { Router } from 'express'

// Import existing routes
import budgetRoutes from '../../routes/budgets.js'
import categoryRoutes from '../../routes/categories.js'
import transactionRoutes from '../../routes/transactions.js'
import recurringRoutes from '../../routes/recurring-transactions.js'
import goalRoutes from '../../routes/goals.js'
import bankAccountRoutes from '../../routes/bank-accounts.js'
import documentRoutes from '../../routes/documents.js'
import houseRoutes from '../../routes/house.js'
import dashboardRoutes from '../../routes/dashboard.js'

const router = Router()

// Mount all finance routes
router.use('/budgets', budgetRoutes)
router.use('/categories', categoryRoutes)
router.use('/transactions', transactionRoutes)
router.use('/recurring', recurringRoutes)
router.use('/goals', goalRoutes)
router.use('/bank-accounts', bankAccountRoutes)
router.use('/documents', documentRoutes)
router.use('/house', houseRoutes)
router.use('/dashboard', dashboardRoutes)

export default router
