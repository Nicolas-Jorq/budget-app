import { Router } from 'express'
import { transactionController } from '../controllers/transactions.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', transactionController.getAll)
router.get('/:id', transactionController.getById)
router.post('/', transactionController.create)
router.put('/:id', transactionController.update)
router.delete('/:id', transactionController.delete)

export default router
