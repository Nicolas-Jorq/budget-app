/**
 * @fileoverview Transaction routes with validation.
 * @module routes/transactions
 */

import { Router } from 'express'
import { transactionController } from '../controllers/transactions.js'
import { authenticate } from '../middleware/auth.js'
import { validate, validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionListQuerySchema,
  idParamSchema,
} from '../schemas/index.js'

const router = Router()

router.use(authenticate)

router.get('/', validateQuery(transactionListQuerySchema), transactionController.getAll)
router.get('/:id', validateParams(idParamSchema), transactionController.getById)
router.post('/', validateBody(createTransactionSchema), transactionController.create)
router.put('/:id', validate({ params: idParamSchema, body: updateTransactionSchema }), transactionController.update)
router.delete('/:id', validateParams(idParamSchema), transactionController.delete)

export default router
