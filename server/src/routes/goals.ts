import { Router } from 'express'
import { goalsController } from '../controllers/goals.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Goals CRUD
router.get('/', goalsController.getAll)
router.get('/summary', goalsController.getSummary)
router.get('/:id', goalsController.getById)
router.post('/', goalsController.create)
router.put('/:id', goalsController.update)
router.delete('/:id', goalsController.delete)

// Contributions
router.get('/:id/contributions', goalsController.getContributions)
router.post('/:id/contributions', goalsController.addContribution)
router.delete('/:id/contributions/:contributionId', goalsController.removeContribution)

export default router
