import { Router } from 'express'
import { budgetController } from '../controllers/budgets.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', budgetController.getAll)
router.get('/:id', budgetController.getById)
router.post('/', budgetController.create)
router.put('/:id', budgetController.update)
router.delete('/:id', budgetController.delete)

export default router
