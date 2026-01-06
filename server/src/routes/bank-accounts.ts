import { Router } from 'express'
import { bankAccountController } from '../controllers/bank-accounts.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// CRUD routes
router.get('/', bankAccountController.getAll)
router.get('/:id', bankAccountController.getById)
router.post('/', bankAccountController.create)
router.put('/:id', bankAccountController.update)
router.delete('/:id', bankAccountController.delete)

export default router
