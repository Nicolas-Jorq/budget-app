/**
 * @fileoverview Main API Routes
 *
 * Configures all API routes with module-based organization.
 *
 * Route Structure:
 * - /api/auth/* - Authentication (module-agnostic)
 * - /api/modules/* - Module management
 * - /api/finance/* - Finance module (new namespaced routes)
 *
 * Legacy routes (for backward compatibility):
 * - /api/budgets, /api/transactions, etc. still work but map to finance module
 *
 * @module routes
 */

import { Router } from 'express'

// Auth routes (module-agnostic)
import authRoutes from './auth.js'

// Module system
import { modulesRoutes } from '../modules/core/index.js'
import { financeRoutes } from '../modules/finance/index.js'

// Legacy route imports (for backward compatibility)
import budgetRoutes from './budgets.js'
import transactionRoutes from './transactions.js'
import dashboardRoutes from './dashboard.js'
import goalsRoutes from './goals.js'
import houseRoutes from './house.js'
import bankAccountRoutes from './bank-accounts.js'
import documentRoutes from './documents.js'
import recurringTransactionRoutes from './recurring-transactions.js'
import categoriesRoutes from './categories.js'

const router = Router()

// API root - updated to reflect module structure
router.get('/', (_req, res) => {
  res.json({
    message: 'Budget App API',
    version: '1.4.0',
    modules: {
      core: '/api/modules',
      finance: '/api/finance',
      health: '/api/health (coming soon)',
      tasks: '/api/tasks (coming soon)',
      lifeGoals: '/api/life-goals (coming soon)',
    },
    endpoints: {
      auth: '/api/auth',
      modules: '/api/modules',
      finance: {
        root: '/api/finance',
        budgets: '/api/finance/budgets',
        categories: '/api/finance/categories',
        transactions: '/api/finance/transactions',
        recurring: '/api/finance/recurring',
        goals: '/api/finance/goals',
        house: '/api/finance/house',
        bankAccounts: '/api/finance/bank-accounts',
        documents: '/api/finance/documents',
        dashboard: '/api/finance/dashboard',
      },
      // Legacy endpoints (deprecated, use /api/finance/* instead)
      legacy: {
        budgets: '/api/budgets',
        transactions: '/api/transactions',
        // ... other legacy routes
      },
    },
  })
})

// ==========================================
// Core Routes (Module-Agnostic)
// ==========================================

router.use('/auth', authRoutes)
router.use('/modules', modulesRoutes)

// ==========================================
// Module Routes (Namespaced)
// ==========================================

// Finance module - all finance routes under /api/finance/*
router.use('/finance', financeRoutes)

// ==========================================
// Legacy Routes (Backward Compatibility)
// ==========================================
// These routes are deprecated but maintained for backward compatibility.
// New code should use /api/finance/* routes.

router.use('/budgets', budgetRoutes)
router.use('/transactions', transactionRoutes)
router.use('/recurring', recurringTransactionRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/goals', goalsRoutes)
router.use('/house', houseRoutes)
router.use('/bank-accounts', bankAccountRoutes)
router.use('/documents', documentRoutes)
router.use('/categories', categoriesRoutes)

export default router
