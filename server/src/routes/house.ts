/**
 * @fileoverview House Routes
 *
 * API routes for house savings features including property search,
 * valuations, saved properties, mortgage calculations, and AI insights.
 *
 * @module routes/house
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  houseGoalController,
  propertyController,
  savedPropertiesController,
  mortgageController,
  insightsController,
} from '../controllers/house.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// ==========================================
// Property Search & Valuation (no goal required)
// ==========================================

/**
 * @route GET /api/house/search
 * @desc Search for properties
 * @query {string} location - City, State or ZIP code (required)
 * @query {number} minPrice - Minimum price filter
 * @query {number} maxPrice - Maximum price filter
 * @query {number} bedrooms - Minimum bedrooms
 * @query {number} bathrooms - Minimum bathrooms
 * @query {string} propertyType - Property type filter
 * @query {number} limit - Max results (default: 20)
 */
router.get('/search', propertyController.search)

/**
 * @route GET /api/house/property/:propertyId
 * @desc Get detailed property information
 */
router.get('/property/:propertyId', propertyController.getDetails)

/**
 * @route GET /api/house/valuation
 * @desc Get home valuation estimate
 * @query {string} address - Full property address (required)
 */
router.get('/valuation', propertyController.getValuation)

// ==========================================
// Mortgage Calculator
// ==========================================

/**
 * @route POST /api/house/mortgage/calculate
 * @desc Calculate mortgage payments
 * @body {number} homePrice - Purchase price
 * @body {number} downPaymentPct - Down payment percentage
 * @body {number} interestRate - Annual interest rate
 * @body {number} loanTermYears - Loan term (15 or 30)
 * @body {number} [propertyTaxRate] - Annual tax rate (default: 1.2%)
 * @body {number} [insuranceRate] - Annual insurance rate (default: 0.35%)
 * @body {number} [pmiRate] - PMI rate if < 20% down (default: 0.5%)
 * @body {number} [hoaMonthly] - Monthly HOA fee
 */
router.post('/mortgage/calculate', mortgageController.calculate)

// ==========================================
// AI Insights
// ==========================================

/**
 * @route POST /api/house/insights/market
 * @desc Get AI-powered market analysis
 * @body {string} location - City, State or ZIP code
 * @body {number} [minPrice] - Min price for context
 * @body {number} [maxPrice] - Max price for context
 */
router.post('/insights/market', insightsController.getMarketInsights)

/**
 * @route POST /api/house/insights/property
 * @desc Get AI evaluation of a property
 * @body {object} property - Property listing data
 */
router.post('/insights/property', insightsController.getPropertyInsight)

/**
 * @route GET /api/house/providers/status
 * @desc Check status of configured providers
 */
router.get('/providers/status', insightsController.getProviderStatus)

// ==========================================
// House Goal Configuration (goal-specific)
// ==========================================

/**
 * @route GET /api/house/goals/:goalId
 * @desc Get house goal configuration
 */
router.get('/goals/:goalId', houseGoalController.get)

/**
 * @route POST /api/house/goals/:goalId
 * @desc Create house goal configuration
 * @body {number} targetPrice - Target home price
 * @body {string} [targetLocation] - Preferred location
 * @body {number} [targetBedrooms] - Preferred bedrooms
 * @body {number} [targetBathrooms] - Preferred bathrooms
 * @body {number} [downPaymentPct] - Down payment goal (default: 20)
 * @body {string} [propertyType] - Preferred property type
 */
router.post('/goals/:goalId', houseGoalController.create)

/**
 * @route PUT /api/house/goals/:goalId
 * @desc Update house goal configuration
 */
router.put('/goals/:goalId', houseGoalController.update)

// ==========================================
// Saved Properties (goal-specific)
// ==========================================

/**
 * @route GET /api/house/goals/:goalId/properties
 * @desc Get all saved properties for a house goal
 */
router.get('/goals/:goalId/properties', savedPropertiesController.getAll)

/**
 * @route POST /api/house/goals/:goalId/properties
 * @desc Save a property to the house goal
 */
router.post('/goals/:goalId/properties', savedPropertiesController.save)

/**
 * @route PATCH /api/house/goals/:goalId/properties/:propertyId/favorite
 * @desc Toggle favorite status of a saved property
 */
router.patch('/goals/:goalId/properties/:propertyId/favorite', savedPropertiesController.toggleFavorite)

/**
 * @route PATCH /api/house/goals/:goalId/properties/:propertyId/notes
 * @desc Update notes on a saved property
 */
router.patch('/goals/:goalId/properties/:propertyId/notes', savedPropertiesController.updateNotes)

/**
 * @route DELETE /api/house/goals/:goalId/properties/:propertyId
 * @desc Remove a saved property
 */
router.delete('/goals/:goalId/properties/:propertyId', savedPropertiesController.delete)

export default router
