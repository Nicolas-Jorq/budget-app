/**
 * @fileoverview Budget routes with validation.
 * @module routes/budgets
 */

import { Router } from 'express'
import { budgetController } from '../controllers/budgets.js'
import { authenticate } from '../middleware/auth.js'
import { validate, validateBody, validateParams } from '../middleware/validate.js'
import { createBudgetSchema, updateBudgetSchema, idParamSchema } from '../schemas/index.js'

const router = Router()

router.use(authenticate)

router.get('/', budgetController.getAll)
router.get('/:id', validateParams(idParamSchema), budgetController.getById)
router.post('/', validateBody(createBudgetSchema), budgetController.create)
router.put('/:id', validate({ params: idParamSchema, body: updateBudgetSchema }), budgetController.update)
router.delete('/:id', validateParams(idParamSchema), budgetController.delete)

export default router
