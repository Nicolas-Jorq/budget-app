import { Router } from 'express'
import multer from 'multer'
import { documentController } from '../controllers/documents.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Configure multer for file uploads (memory storage for passing to AI service)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// All routes require authentication
router.use(authenticate)

// LLM Providers
router.get('/providers', documentController.getProviders)

// Document management
router.get('/', documentController.getAll)
router.get('/:id', documentController.getById)
router.post('/upload', upload.single('file'), documentController.upload)
router.post('/:id/process', documentController.process)
router.delete('/:id', documentController.delete)
router.get('/:id/summary', documentController.getSummary)

// Transaction review
router.put('/:id/transactions/:transactionId', documentController.updateTransaction)
router.post('/:id/transactions/:transactionId/approve', documentController.approveTransaction)
router.post('/:id/transactions/:transactionId/reject', documentController.rejectTransaction)
router.post('/:id/transactions/bulk', documentController.bulkAction)
router.post('/:id/import', documentController.importTransactions)
router.post('/:id/check-duplicates', documentController.checkDuplicates)

export default router
