import { Router } from 'express'
import { houseController } from '../controllers/house.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All house routes require authentication
router.use(authenticate)

/**
 * Property Search & Details (uses configured real estate provider)
 * GET /api/house/search - Search properties by location
 * GET /api/house/property/:propertyId - Get property details
 * GET /api/house/valuation - Get home valuation by address
 */
router.get('/search', houseController.searchProperties)
router.get('/property/:propertyId', houseController.getPropertyDetails)
router.get('/valuation', houseController.getHomeValuation)

/**
 * Mortgage Calculator (works offline, no API needed)
 * POST /api/house/mortgage/calculate - Calculate mortgage payments
 */
router.post('/mortgage/calculate', houseController.calculateMortgage)

/**
 * AI Insights (uses configured LLM provider)
 * POST /api/house/insights - Get AI market insights
 */
router.post('/insights', houseController.getMarketInsight)

/**
 * Provider Status (for debugging/admin)
 * GET /api/house/providers/status - Check provider availability
 */
router.get('/providers/status', houseController.getProviderStatus)

export default router
