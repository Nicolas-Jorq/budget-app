import { Router } from 'express'
import { authController } from '../controllers/auth.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authenticate, authController.me)

export default router
