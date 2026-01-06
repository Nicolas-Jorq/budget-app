/**
 * @fileoverview Recurring Transactions Routes
 *
 * API endpoints for recurring transaction management.
 *
 * Routes:
 * - GET    /api/recurring           - Get all recurring transactions
 * - GET    /api/recurring/upcoming  - Get upcoming scheduled transactions
 * - POST   /api/recurring           - Create new recurring transaction
 * - POST   /api/recurring/process   - Process due transactions
 * - GET    /api/recurring/:id       - Get single recurring transaction
 * - PUT    /api/recurring/:id       - Update recurring transaction
 * - DELETE /api/recurring/:id       - Delete recurring transaction
 * - GET    /api/recurring/:id/transactions - Get generated transactions
 * - POST   /api/recurring/:id/skip  - Skip next occurrence
 *
 * @module routes/recurring-transactions
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { recurringTransactionsController } from '../controllers/recurring-transactions.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Collection routes (must come before :id routes)
router.get('/upcoming', recurringTransactionsController.getUpcoming)
router.post('/process', recurringTransactionsController.processDue)

// CRUD routes
router.get('/', recurringTransactionsController.getAll)
router.post('/', recurringTransactionsController.create)
router.get('/:id', recurringTransactionsController.getById)
router.put('/:id', recurringTransactionsController.update)
router.delete('/:id', recurringTransactionsController.delete)

// Instance routes
router.get('/:id/transactions', recurringTransactionsController.getGeneratedTransactions)
router.post('/:id/skip', recurringTransactionsController.skipNext)

export default router
