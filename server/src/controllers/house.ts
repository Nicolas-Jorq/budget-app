/**
 * @fileoverview House Controller
 *
 * Request handlers for house savings features including
 * property search, valuations, saved properties, and mortgage calculations.
 *
 * @module controllers/house
 */

import { Request, Response, NextFunction } from 'express'
import { houseService } from '../services/house.js'
import { AppError } from '../utils/errors.js'

/**
 * Extended Request with authenticated user
 */
interface AuthRequest extends Request {
  user?: { id: string }
}

/**
 * House goal configuration handlers
 */
export const houseGoalController = {
  /**
   * GET /api/goals/:goalId/house
   * Get house goal configuration
   */
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params
      const userId = req.user!.id

      const houseGoal = await houseService.getHouseGoal(goalId, userId)

      res.json({
        success: true,
        data: houseGoal,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * POST /api/goals/:goalId/house
   * Create house goal configuration
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params
      const userId = req.user!.id

      const houseGoal = await houseService.createHouseGoal(goalId, userId, req.body)

      res.status(201).json({
        success: true,
        data: houseGoal,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * PUT /api/goals/:goalId/house
   * Update house goal configuration
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params
      const userId = req.user!.id

      const houseGoal = await houseService.updateHouseGoal(goalId, userId, req.body)

      res.json({
        success: true,
        data: houseGoal,
      })
    } catch (error) {
      next(error)
    }
  },
}

/**
 * Property search and details handlers
 */
export const propertyController = {
  /**
   * GET /api/house/search
   * Search for properties
   */
  async search(req: AuthRequest, res: Response, next: NextFunction) {
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
        throw AppError.validation('Location is required')
      }

      const properties = await houseService.searchProperties({
        location,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        propertyType: propertyType ? String(propertyType) : undefined,
        limit: limit ? Number(limit) : 20,
      })

      res.json({
        success: true,
        data: properties,
        count: properties.length,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * GET /api/house/property/:propertyId
   * Get property details
   */
  async getDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params

      const property = await houseService.getPropertyDetails(propertyId)

      res.json({
        success: true,
        data: property,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * GET /api/house/valuation
   * Get home valuation for an address
   */
  async getValuation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { address } = req.query

      if (!address || typeof address !== 'string') {
        throw AppError.validation('Address is required')
      }

      const valuation = await houseService.getHomeValuation(address)

      if (!valuation) {
        res.json({
          success: true,
          data: null,
          message: 'Valuation not available for this address',
        })
        return
      }

      res.json({
        success: true,
        data: valuation,
      })
    } catch (error) {
      next(error)
    }
  },
}

/**
 * Saved properties handlers
 */
export const savedPropertiesController = {
  /**
   * GET /api/goals/:goalId/properties
   * Get all saved properties for a house goal
   */
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params
      const userId = req.user!.id

      const properties = await houseService.getSavedProperties(goalId, userId)

      res.json({
        success: true,
        data: properties,
        count: properties.length,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * POST /api/goals/:goalId/properties
   * Save a property to the house goal
   */
  async save(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params
      const userId = req.user!.id

      const property = await houseService.saveProperty(goalId, userId, req.body)

      res.status(201).json({
        success: true,
        data: property,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * PATCH /api/goals/:goalId/properties/:propertyId/favorite
   * Toggle favorite status
   */
  async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId, propertyId } = req.params
      const userId = req.user!.id

      const property = await houseService.togglePropertyFavorite(propertyId, goalId, userId)

      res.json({
        success: true,
        data: property,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * PATCH /api/goals/:goalId/properties/:propertyId/notes
   * Update property notes
   */
  async updateNotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId, propertyId } = req.params
      const userId = req.user!.id
      const { notes } = req.body

      const property = await houseService.updatePropertyNotes(propertyId, goalId, userId, notes)

      res.json({
        success: true,
        data: property,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * DELETE /api/goals/:goalId/properties/:propertyId
   * Delete a saved property
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId, propertyId } = req.params
      const userId = req.user!.id

      await houseService.deleteProperty(propertyId, goalId, userId)

      res.json({
        success: true,
        message: 'Property removed from saved list',
      })
    } catch (error) {
      next(error)
    }
  },
}

/**
 * Mortgage calculator handlers
 */
export const mortgageController = {
  /**
   * POST /api/house/mortgage/calculate
   * Calculate mortgage payments
   */
  async calculate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        homePrice,
        downPaymentPct,
        interestRate,
        loanTermYears,
        propertyTaxRate,
        insuranceRate,
        pmiRate,
        hoaMonthly,
      } = req.body

      if (!homePrice || !downPaymentPct || !interestRate || !loanTermYears) {
        throw AppError.validation('homePrice, downPaymentPct, interestRate, and loanTermYears are required')
      }

      const result = houseService.calculateMortgage({
        homePrice: Number(homePrice),
        downPaymentPct: Number(downPaymentPct),
        interestRate: Number(interestRate),
        loanTermYears: Number(loanTermYears),
        propertyTaxRate: propertyTaxRate ? Number(propertyTaxRate) : undefined,
        insuranceRate: insuranceRate ? Number(insuranceRate) : undefined,
        pmiRate: pmiRate ? Number(pmiRate) : undefined,
        hoaMonthly: hoaMonthly ? Number(hoaMonthly) : undefined,
      })

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },
}

/**
 * AI insights handlers
 */
export const insightsController = {
  /**
   * POST /api/house/insights/market
   * Get AI market insights for a location
   */
  async getMarketInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { location, minPrice, maxPrice } = req.body

      if (!location) {
        throw AppError.validation('Location is required')
      }

      const insights = await houseService.getMarketInsights(location, {
        min: minPrice ? Number(minPrice) : undefined,
        max: maxPrice ? Number(maxPrice) : undefined,
      })

      res.json({
        success: true,
        ...insights,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * POST /api/house/insights/property
   * Get AI insights for a specific property
   */
  async getPropertyInsight(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const property = req.body

      if (!property.address || !property.price) {
        throw AppError.validation('Property address and price are required')
      }

      const insight = await houseService.getPropertyInsight(property)

      res.json({
        success: true,
        ...insight,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * GET /api/house/providers/status
   * Check provider availability
   */
  async getProviderStatus(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const status = await houseService.checkProviderStatus()

      res.json({
        success: true,
        data: status,
      })
    } catch (error) {
      next(error)
    }
  },
}

/**
 * Combined house controller for legacy route compatibility
 * Used by /api/goals/:goalId/house routes
 */
export const houseController = {
  getHouseGoal: houseGoalController.get,
  createHouseGoal: houseGoalController.create,
  updateHouseGoal: houseGoalController.update,

  async getHouseGoalSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params
      const userId = req.user!.id

      const houseGoal = await houseService.getHouseGoal(goalId, userId)
      if (!houseGoal) {
        throw AppError.notFound('House goal', goalId)
      }

      // Calculate summary data
      const savedProperties = await houseService.getSavedProperties(goalId, userId)
      const favoritesCount = savedProperties.filter(p => p.isFavorite).length

      res.json({
        success: true,
        data: {
          ...houseGoal,
          savedPropertiesCount: savedProperties.length,
          favoritesCount,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  getSavedProperties: savedPropertiesController.getAll,
  saveProperty: savedPropertiesController.save,

  async updateSavedProperty(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId, propertyId } = req.params
      const userId = req.user!.id
      const { notes, isFavorite } = req.body

      let property
      if (notes !== undefined) {
        property = await houseService.updatePropertyNotes(propertyId, goalId, userId, notes)
      }
      if (isFavorite !== undefined) {
        property = await houseService.togglePropertyFavorite(propertyId, goalId, userId)
      }

      res.json({
        success: true,
        data: property,
      })
    } catch (error) {
      next(error)
    }
  },

  deleteSavedProperty: savedPropertiesController.delete,
}
