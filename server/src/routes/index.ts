/**
 * @fileoverview Main API Routes
 *
 * Configures all API routes with module-based organization.
 *
 * Route Structure:
 * - /api/auth/* - Authentication (module-agnostic)
 * - /api/modules/* - Module management
 * - /api/finance/* - Finance module
 * - /api/health/* - Health module
 * - /api/tasks/* - Tasks module
 * - /api/life-goals/* - Life Goals module
 *
 * @module routes
 */

import { Router } from 'express'
import { APP_CONFIG } from '../config/app.js'

// Auth routes (module-agnostic)
import authRoutes from './auth.js'

// Module system
import { modulesRoutes } from '../modules/core/index.js'
import { financeRoutes } from '../modules/finance/index.js'
import { healthRoutes } from '../modules/health/index.js'
import { tasksRoutes } from '../modules/tasks/index.js'
import { lifeGoalsRoutes } from '../modules/life-goals/index.js'

const router = Router()

// API root - shows available endpoints
router.get('/', (_req, res) => {
  res.json({
    message: `${APP_CONFIG.name} API`,
    version: APP_CONFIG.version,
    modules: {
      core: '/api/modules',
      finance: '/api/finance',
      health: '/api/health',
      tasks: '/api/tasks',
      lifeGoals: '/api/life-goals',
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
      health: '/api/health',
      tasks: '/api/tasks',
      lifeGoals: '/api/life-goals',
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

// Health module - all health routes under /api/health/*
router.use('/health', healthRoutes)

// Tasks module - all tasks routes under /api/tasks/*
router.use('/tasks', tasksRoutes)

// Life Goals module - all life goals routes under /api/life-goals/*
router.use('/life-goals', lifeGoalsRoutes)

export default router
