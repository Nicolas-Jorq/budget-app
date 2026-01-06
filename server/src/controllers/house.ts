/**
 * @fileoverview House goal management controller for the Budget App.
 *
 * This controller handles all HTTP endpoints related to house buying goals, including:
 * - House goal CRUD operations (create, read, update)
 * - Property search and valuation via real estate providers
 * - Saved property management for tracking potential homes
 * - Mortgage calculations with detailed payment breakdowns
 * - AI-powered market insights for informed home buying decisions
 * - Provider status monitoring for external service health
 *
 * The controller integrates with the house service which manages database operations
 * and external provider interactions (real estate APIs, LLM providers).
 *
 * @module controllers/house
 *
 * @example
 * // Route setup
 * router.get('/goals/:goalId/house', houseController.getHouseGoal);
 * router.post('/goals/:goalId/house', houseController.createHouseGoal);
 * router.get('/properties/search', houseController.searchProperties);
 */

import { Response } from 'express'
import { houseService } from '../services/house.js'
import { PropertyType } from '../providers/real-estate/types.js'
import { AuthRequest } from '../middleware/auth.js'
import { AppError, isAppError } from '../utils/errors.js'

/**
 * House goal controller providing HTTP request handlers for house buying features.
 *
 * All endpoints require authentication and validate user ownership before
 * performing operations on house goals and properties.
 *
 * @example
 * // Using in Express router
 * router.get('/goals/:goalId/house', houseController.getHouseGoal);
 * router.post('/goals/:goalId/house', houseController.createHouseGoal);
 */
export const houseController = {
  // ==========================================
  // House Goal CRUD
  // ==========================================

  /**
   * Retrieves a house goal by ID with all saved properties.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.goalId - The house goal ID to retrieve
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with house goal data
   *
   * @throws {AppError} 404 - House goal not found
   * @throws {AppError} 500 - Failed to retrieve house goal
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns house goal with saved properties
   * - 404: House goal not found for the given ID and user
   * - 500: Internal server error
   *
   * @example
   * // GET /api/goals/:goalId/house
   * // Response: { id: '...', name: '...', houseGoal: { targetPrice: 500000, ... } }
   */
  async getHouseGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!

      const goal = await houseService.getHouseGoal(goalId, userId)

      if (!goal) {
        throw AppError.notFound('House goal', goalId)
      }

      res.json(goal)
    } catch (error) {
      console.error('Error getting house goal:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ error: 'Failed to get house goal' })
    }
  },

  /**
   * Creates a new house goal configuration for an existing savings goal.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.goalId - The savings goal ID to attach house config to
   * @param {Object} req.body - House goal creation data
   * @param {number} req.body.targetPrice - Target home price
   * @param {string} [req.body.targetLocation] - Desired location/area
   * @param {number} [req.body.targetBedrooms] - Desired number of bedrooms
   * @param {number} [req.body.targetBathrooms] - Desired number of bathrooms
   * @param {number} [req.body.downPaymentPct] - Down payment percentage (default: 20)
   * @param {string} [req.body.propertyType] - Type of property (e.g., 'SINGLE_FAMILY')
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with created house goal
   *
   * @throws {AppError} 400 - Goal not found, not a house type, or config already exists
   * @throws {AppError} 500 - Failed to create house goal
   *
   * @description
   * HTTP Response Codes:
   * - 201: Created - Returns newly created house goal
   * - 400: Validation error (goal not found, wrong type, or already configured)
   * - 500: Internal server error
   *
   * @example
   * // POST /api/goals/:goalId/house
   * // Body: { targetPrice: 500000, targetLocation: 'Seattle, WA', targetBedrooms: 3 }
   * // Response: { id: '...', goalId: '...', targetPrice: 500000, ... }
   */
  async createHouseGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!
      const data = req.body

      const houseGoal = await houseService.createHouseGoal(goalId, userId, data)
      res.status(201).json(houseGoal)
    } catch (error: any) {
      console.error('Error creating house goal:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      if (error.message?.includes('not found') || error.message?.includes('already exists')) {
        const appError = AppError.validation(error.message)
        return res.status(appError.statusCode).json(appError.toJSON())
      }
      res.status(500).json({ error: 'Failed to create house goal' })
    }
  },

  /**
   * Updates an existing house goal configuration.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.goalId - The house goal ID to update
   * @param {Object} req.body - Fields to update (all optional)
   * @param {number} [req.body.targetPrice] - Updated target price
   * @param {string} [req.body.targetLocation] - Updated target location
   * @param {number} [req.body.targetBedrooms] - Updated bedroom count
   * @param {number} [req.body.targetBathrooms] - Updated bathroom count
   * @param {number} [req.body.downPaymentPct] - Updated down payment percentage
   * @param {string} [req.body.propertyType] - Updated property type
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with updated house goal
   *
   * @throws {AppError} 404 - House goal not found
   * @throws {AppError} 500 - Failed to update house goal
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns updated house goal
   * - 404: House goal not found
   * - 500: Internal server error
   *
   * @example
   * // PUT /api/goals/:goalId/house
   * // Body: { targetPrice: 550000 }
   * // Response: { id: '...', targetPrice: 550000, ... }
   */
  async updateHouseGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!
      const data = req.body

      const houseGoal = await houseService.updateHouseGoal(goalId, userId, data)
      res.json(houseGoal)
    } catch (error: any) {
      console.error('Error updating house goal:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      if (error.message?.includes('not found')) {
        const appError = AppError.notFound('House goal', req.params.goalId)
        return res.status(appError.statusCode).json(appError.toJSON())
      }
      res.status(500).json({ error: 'Failed to update house goal' })
    }
  },

  /**
   * Retrieves a comprehensive summary of a house goal including progress metrics.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.goalId - The house goal ID to summarize
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with house goal summary
   *
   * @throws {AppError} 404 - House goal not found
   * @throws {AppError} 500 - Failed to get summary
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns summary with progress, mortgage estimates, saved properties count
   * - 404: House goal not found
   * - 500: Internal server error
   *
   * @example
   * // GET /api/goals/:goalId/house/summary
   * // Response: { goal: {...}, houseDetails: {...}, progress: {...}, mortgageEstimate: {...} }
   */
  async getHouseGoalSummary(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!

      const summary = await houseService.getHouseGoalSummary(goalId, userId)

      if (!summary) {
        throw AppError.notFound('House goal', goalId)
      }

      res.json(summary)
    } catch (error) {
      console.error('Error getting house goal summary:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ error: 'Failed to get house goal summary' })
    }
  },

  // ==========================================
  // Property Search & Details
  // ==========================================

  /**
   * Searches for properties based on provided criteria.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.query.location - Required location to search (city, zip, address)
   * @param {string} [req.query.minPrice] - Minimum price filter
   * @param {string} [req.query.maxPrice] - Maximum price filter
   * @param {string} [req.query.bedrooms] - Minimum bedroom count
   * @param {string} [req.query.bathrooms] - Minimum bathroom count
   * @param {string} [req.query.propertyType] - Property type filter
   * @param {string} [req.query.limit] - Max results to return (default: 20)
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with property listings
   *
   * @throws {AppError} 400 - Location parameter is required
   * @throws {AppError} 500 - Failed to search properties
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns array of property listings
   * - 400: Missing required location parameter
   * - 500: Internal server error or provider unavailable
   *
   * @example
   * // GET /api/properties/search?location=Seattle,WA&minPrice=400000&bedrooms=3
   * // Response: [{ zpid: '...', address: '...', price: 450000, ... }, ...]
   */
  async searchProperties(req: AuthRequest, res: Response) {
    try {
      const {
        location,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        propertyType,
        limit,
      } = req.query

      if (!location || typeof location !== 'string') {
        throw AppError.validation('Location is required', { field: 'location' })
      }

      const properties = await houseService.searchProperties({
        location,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        propertyType: propertyType as PropertyType | undefined,
        limit: limit ? Number(limit) : 20,
      })

      res.json(properties)
    } catch (error) {
      console.error('Error searching properties:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ error: 'Failed to search properties' })
    }
  },

  /**
   * Retrieves detailed information about a specific property.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.propertyId - The property ID (e.g., Zillow zpid)
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with property details
   *
   * @throws {AppError} 404 - Property not found
   * @throws {AppError} 500 - Failed to get property details
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns detailed property information
   * - 404: Property not found
   * - 500: Internal server error or provider unavailable
   *
   * @example
   * // GET /api/properties/:propertyId
   * // Response: { zpid: '...', address: '...', price: 500000, bedrooms: 3, ... }
   */
  async getPropertyDetails(req: AuthRequest, res: Response) {
    try {
      const { propertyId } = req.params

      const property = await houseService.getPropertyDetails(propertyId)

      if (!property) {
        throw AppError.notFound('Property', propertyId)
      }

      res.json(property)
    } catch (error) {
      console.error('Error getting property details:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ error: 'Failed to get property details' })
    }
  },

  /**
   * Gets a home valuation estimate for a given address.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.query.address - The full address to get valuation for
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with valuation data
   *
   * @throws {AppError} 400 - Address parameter is required
   * @throws {AppError} 404 - Could not get valuation for address
   * @throws {AppError} 500 - Failed to get valuation
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns valuation estimate with range
   * - 400: Missing required address parameter
   * - 404: Valuation not available for this address
   * - 500: Internal server error or provider unavailable
   *
   * @example
   * // GET /api/properties/valuation?address=123 Main St, Seattle, WA 98101
   * // Response: { zestimate: 550000, zestimateRange: { low: 520000, high: 580000 } }
   */
  async getHomeValuation(req: AuthRequest, res: Response) {
    try {
      const { address } = req.query

      if (!address || typeof address !== 'string') {
        throw AppError.validation('Address is required', { field: 'address' })
      }

      const valuation = await houseService.getHomeValuation(address)

      if (!valuation) {
        throw AppError.notFound('Valuation for address', address)
      }

      res.json(valuation)
    } catch (error) {
      console.error('Error getting home valuation:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ error: 'Failed to get home valuation' })
    }
  },

  // ==========================================
  // Saved Properties
  // ==========================================

  /**
   * Retrieves all saved properties for a house goal.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.goalId - The house goal ID
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with saved properties
   *
   * @throws {AppError} 404 - House goal not found
   * @throws {AppError} 500 - Failed to get saved properties
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns array of saved property snapshots
   * - 404: House goal not found
   * - 500: Internal server error
   *
   * @example
   * // GET /api/goals/:goalId/house/properties
   * // Response: [{ id: '...', address: '...', price: 450000, isFavorite: true }, ...]
   */
  async getSavedProperties(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!

      const properties = await houseService.getSavedProperties(goalId, userId)
      res.json(properties)
    } catch (error: any) {
      console.error('Error getting saved properties:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      if (error.message?.includes('not found')) {
        const appError = AppError.notFound('House goal', req.params.goalId)
        return res.status(appError.statusCode).json(appError.toJSON())
      }
      res.status(500).json({ error: 'Failed to get saved properties' })
    }
  },

  /**
   * Saves a property snapshot to a house goal.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.goalId - The house goal ID
   * @param {Object} req.body - Property data to save
   * @param {string} req.body.address - Property street address
   * @param {string} req.body.city - City name
   * @param {string} req.body.state - State abbreviation
   * @param {string} req.body.zipCode - ZIP code
   * @param {number} req.body.price - Listing price
   * @param {string} [req.body.zpid] - Zillow property ID
   * @param {number} [req.body.bedrooms] - Number of bedrooms
   * @param {number} [req.body.bathrooms] - Number of bathrooms
   * @param {number} [req.body.sqft] - Square footage
   * @param {number} [req.body.yearBuilt] - Year property was built
   * @param {string} [req.body.propertyType] - Type of property
   * @param {number} [req.body.zestimate] - Zillow estimate value
   * @param {string} [req.body.imageUrl] - Property image URL
   * @param {string} [req.body.listingUrl] - Listing page URL
   * @param {string} [req.body.notes] - User notes about property
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with saved property
   *
   * @throws {AppError} 404 - House goal not found
   * @throws {AppError} 500 - Failed to save property
   *
   * @description
   * HTTP Response Codes:
   * - 201: Created - Returns saved property snapshot
   * - 404: House goal not found
   * - 500: Internal server error
   *
   * @example
   * // POST /api/goals/:goalId/house/properties
   * // Body: { address: '123 Main St', city: 'Seattle', state: 'WA', zipCode: '98101', price: 500000 }
   * // Response: { id: '...', address: '123 Main St', price: 500000, isFavorite: false, ... }
   */
  async saveProperty(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!
      const data = req.body

      const property = await houseService.saveProperty(goalId, userId, data)
      res.status(201).json(property)
    } catch (error: any) {
      console.error('Error saving property:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      if (error.message?.includes('not found')) {
        const appError = AppError.notFound('House goal', req.params.goalId)
        return res.status(appError.statusCode).json(appError.toJSON())
      }
      res.status(500).json({ error: 'Failed to save property' })
    }
  },

  /**
   * Updates a saved property (e.g., toggle favorite, add notes).
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.goalId - The house goal ID
   * @param {string} req.params.propertyId - The saved property ID
   * @param {Object} req.body - Fields to update
   * @param {boolean} [req.body.isFavorite] - Whether property is favorited
   * @param {string} [req.body.notes] - User notes about property
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with updated property
   *
   * @throws {AppError} 404 - House goal or property not found
   * @throws {AppError} 500 - Failed to update property
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns updated property
   * - 404: House goal or property not found
   * - 500: Internal server error
   *
   * @example
   * // PUT /api/goals/:goalId/house/properties/:propertyId
   * // Body: { isFavorite: true, notes: 'Great backyard!' }
   * // Response: { id: '...', isFavorite: true, notes: 'Great backyard!', ... }
   */
  async updateSavedProperty(req: AuthRequest, res: Response) {
    try {
      const { goalId, propertyId } = req.params
      const userId = req.userId!
      const data = req.body

      const property = await houseService.updateSavedProperty(propertyId, goalId, userId, data)
      res.json(property)
    } catch (error: any) {
      console.error('Error updating saved property:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      if (error.message?.includes('not found')) {
        const appError = AppError.notFound('Property', req.params.propertyId)
        return res.status(appError.statusCode).json(appError.toJSON())
      }
      res.status(500).json({ error: 'Failed to update saved property' })
    }
  },

  /**
   * Deletes a saved property from a house goal.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.goalId - The house goal ID
   * @param {string} req.params.propertyId - The saved property ID to delete
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends 204 No Content on success
   *
   * @throws {AppError} 404 - House goal or property not found
   * @throws {AppError} 500 - Failed to delete property
   *
   * @description
   * HTTP Response Codes:
   * - 204: No Content - Property successfully deleted
   * - 404: House goal or property not found
   * - 500: Internal server error
   *
   * @example
   * // DELETE /api/goals/:goalId/house/properties/:propertyId
   * // Response: 204 No Content
   */
  async deleteSavedProperty(req: AuthRequest, res: Response) {
    try {
      const { goalId, propertyId } = req.params
      const userId = req.userId!

      await houseService.deleteSavedProperty(propertyId, goalId, userId)
      res.status(204).send()
    } catch (error: any) {
      console.error('Error deleting saved property:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      if (error.message?.includes('not found')) {
        const appError = AppError.notFound('Property', req.params.propertyId)
        return res.status(appError.statusCode).json(appError.toJSON())
      }
      res.status(500).json({ error: 'Failed to delete saved property' })
    }
  },

  // ==========================================
  // Mortgage Calculator
  // ==========================================

  /**
   * Calculates mortgage payment details based on provided parameters.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Object} req.body - Mortgage calculation parameters
   * @param {number} req.body.homePrice - Total home price
   * @param {number} req.body.downPaymentPercent - Down payment as percentage
   * @param {number} req.body.interestRate - Annual interest rate as percentage
   * @param {number} req.body.loanTermYears - Loan term in years (e.g., 15, 30)
   * @param {number} [req.body.propertyTaxRate] - Annual property tax rate (default: 1.25%)
   * @param {number} [req.body.homeInsuranceRate] - Annual insurance rate (default: 0.35%)
   * @param {number} [req.body.pmiRate] - PMI rate if down payment < 20% (default: 0.5%)
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with mortgage calculation
   *
   * @throws {AppError} 400 - Missing required fields
   * @throws {AppError} 500 - Failed to calculate mortgage
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns detailed mortgage breakdown
   * - 400: Missing required calculation parameters
   * - 500: Internal server error
   *
   * @example
   * // POST /api/mortgage/calculate
   * // Body: { homePrice: 500000, downPaymentPercent: 20, interestRate: 6.5, loanTermYears: 30 }
   * // Response: { monthlyPayment: 2528, monthlyBreakdown: {...}, totalInterest: 510000, ... }
   */
  async calculateMortgage(req: AuthRequest, res: Response) {
    try {
      const {
        homePrice,
        downPaymentPercent,
        interestRate,
        loanTermYears,
        propertyTaxRate,
        homeInsuranceRate,
        pmiRate,
      } = req.body

      if (!homePrice || !downPaymentPercent || !interestRate || !loanTermYears) {
        throw AppError.validation(
          'Required fields: homePrice, downPaymentPercent, interestRate, loanTermYears',
          {
            missing: [
              !homePrice && 'homePrice',
              !downPaymentPercent && 'downPaymentPercent',
              !interestRate && 'interestRate',
              !loanTermYears && 'loanTermYears'
            ].filter(Boolean)
          }
        )
      }

      const result = houseService.calculateMortgage({
        homePrice: Number(homePrice),
        downPaymentPercent: Number(downPaymentPercent),
        interestRate: Number(interestRate),
        loanTermYears: Number(loanTermYears),
        propertyTaxRate: propertyTaxRate ? Number(propertyTaxRate) : undefined,
        homeInsuranceRate: homeInsuranceRate ? Number(homeInsuranceRate) : undefined,
        pmiRate: pmiRate ? Number(pmiRate) : undefined,
      })

      res.json(result)
    } catch (error) {
      console.error('Error calculating mortgage:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ error: 'Failed to calculate mortgage' })
    }
  },

  // ==========================================
  // AI Insights
  // ==========================================

  /**
   * Gets AI-powered market insights for a location.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Object} req.body - Market insight request parameters
   * @param {string} req.body.location - Location to analyze
   * @param {string} req.body.questionType - Type of insight requested
   * @param {string} [req.body.additionalContext] - Additional context for the query
   * @param {string} [req.body.propertyType] - Property type to focus on
   * @param {Object} [req.body.priceRange] - Price range for analysis
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with market insight
   *
   * @throws {AppError} 400 - Missing required fields (location, questionType)
   * @throws {AppError} 500 - Failed to get market insight
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns AI-generated market insight
   * - 400: Missing required parameters
   * - 500: Internal server error or AI service unavailable
   *
   * @example
   * // POST /api/house/insights
   * // Body: { location: 'Seattle, WA', questionType: 'market_trends' }
   * // Response: { insight: '...', confidence: 0.85, sources: [...] }
   */
  async getMarketInsight(req: AuthRequest, res: Response) {
    try {
      const { location, questionType, additionalContext, propertyType, priceRange } = req.body

      if (!location || !questionType) {
        throw AppError.validation(
          'Required fields: location, questionType',
          {
            missing: [
              !location && 'location',
              !questionType && 'questionType'
            ].filter(Boolean)
          }
        )
      }

      const insight = await houseService.getMarketInsight({
        location,
        questionType,
        additionalContext,
        propertyType,
        priceRange,
      })

      res.json(insight)
    } catch (error) {
      console.error('Error getting market insight:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ error: 'Failed to get market insight' })
    }
  },

  // ==========================================
  // Provider Status
  // ==========================================

  /**
   * Gets the current status of all external providers (real estate API, LLM).
   *
   * @param {AuthRequest} _req - Express request (unused)
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with provider status
   *
   * @throws {AppError} 500 - Failed to get provider status
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns status of all providers
   * - 500: Internal server error
   *
   * @example
   * // GET /api/house/providers/status
   * // Response: { realEstate: { available: true, name: 'zillow' }, llm: { available: true, name: 'openai' } }
   */
  async getProviderStatus(_req: AuthRequest, res: Response) {
    try {
      const status = await houseService.getProviderStatus()
      res.json(status)
    } catch (error) {
      console.error('Error getting provider status:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ error: 'Failed to get provider status' })
    }
  },
}
