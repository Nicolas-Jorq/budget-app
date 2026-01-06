import { Router } from 'express'
import { dashboardController } from '../controllers/dashboard.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/stats', dashboardController.getStats)
router.get('/charts', dashboardController.getChartData)

export default router
