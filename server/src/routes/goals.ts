import { Router } from 'express'
import { goalsController } from '../controllers/goals.js'
import { babyGoalsController } from '../controllers/baby-goals.js'
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

// Baby Goal Milestones
router.get('/:goalId/milestones', babyGoalsController.getMilestones)
router.post('/:goalId/milestones', babyGoalsController.createMilestone)
router.post('/:goalId/milestones/defaults', babyGoalsController.createDefaultMilestones)
router.get('/:goalId/milestones/:milestoneId', babyGoalsController.getMilestoneById)
router.put('/:goalId/milestones/:milestoneId', babyGoalsController.updateMilestone)
router.delete('/:goalId/milestones/:milestoneId', babyGoalsController.deleteMilestone)
router.post('/:goalId/milestones/:milestoneId/contribute', babyGoalsController.contributeToMilestone)

// Baby Goal Projections & Timeline
router.get('/:goalId/projections', babyGoalsController.getProjections)
router.get('/:goalId/timeline', babyGoalsController.getTimeline)

export default router
