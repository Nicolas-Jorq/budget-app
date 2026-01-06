import { Response } from 'express'
import { houseService } from '../services/house.js'
import { PropertyType } from '../providers/real-estate/types.js'
import { AuthRequest } from '../middleware/auth.js'

export const houseController = {
  // ==========================================
  // House Goal CRUD
  // ==========================================

  async getHouseGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!

      const goal = await houseService.getHouseGoal(goalId, userId)

      if (!goal) {
        return res.status(404).json({ error: 'House goal not found' })
      }

      res.json(goal)
    } catch (error) {
      console.error('Error getting house goal:', error)
      res.status(500).json({ error: 'Failed to get house goal' })
    }
  },

  async createHouseGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!
      const data = req.body

      const houseGoal = await houseService.createHouseGoal(goalId, userId, data)
      res.status(201).json(houseGoal)
    } catch (error: any) {
      console.error('Error creating house goal:', error)
      if (error.message?.includes('not found') || error.message?.includes('already exists')) {
        return res.status(400).json({ error: error.message })
      }
      res.status(500).json({ error: 'Failed to create house goal' })
    }
  },

  async updateHouseGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!
      const data = req.body

      const houseGoal = await houseService.updateHouseGoal(goalId, userId, data)
      res.json(houseGoal)
    } catch (error: any) {
      console.error('Error updating house goal:', error)
      if (error.message?.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({ error: 'Failed to update house goal' })
    }
  },

  async getHouseGoalSummary(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!

      const summary = await houseService.getHouseGoalSummary(goalId, userId)

      if (!summary) {
        return res.status(404).json({ error: 'House goal not found' })
      }

      res.json(summary)
    } catch (error) {
      console.error('Error getting house goal summary:', error)
      res.status(500).json({ error: 'Failed to get house goal summary' })
    }
  },

  // ==========================================
  // Property Search & Details
  // ==========================================

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
        return res.status(400).json({ error: 'Location is required' })
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
      res.status(500).json({ error: 'Failed to search properties' })
    }
  },

  async getPropertyDetails(req: AuthRequest, res: Response) {
    try {
      const { propertyId } = req.params

      const property = await houseService.getPropertyDetails(propertyId)

      if (!property) {
        return res.status(404).json({ error: 'Property not found' })
      }

      res.json(property)
    } catch (error) {
      console.error('Error getting property details:', error)
      res.status(500).json({ error: 'Failed to get property details' })
    }
  },

  async getHomeValuation(req: AuthRequest, res: Response) {
    try {
      const { address } = req.query

      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'Address is required' })
      }

      const valuation = await houseService.getHomeValuation(address)

      if (!valuation) {
        return res.status(404).json({ error: 'Could not get valuation for this address' })
      }

      res.json(valuation)
    } catch (error) {
      console.error('Error getting home valuation:', error)
      res.status(500).json({ error: 'Failed to get home valuation' })
    }
  },

  // ==========================================
  // Saved Properties
  // ==========================================

  async getSavedProperties(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!

      const properties = await houseService.getSavedProperties(goalId, userId)
      res.json(properties)
    } catch (error: any) {
      console.error('Error getting saved properties:', error)
      if (error.message?.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({ error: 'Failed to get saved properties' })
    }
  },

  async saveProperty(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params
      const userId = req.userId!
      const data = req.body

      const property = await houseService.saveProperty(goalId, userId, data)
      res.status(201).json(property)
    } catch (error: any) {
      console.error('Error saving property:', error)
      if (error.message?.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({ error: 'Failed to save property' })
    }
  },

  async updateSavedProperty(req: AuthRequest, res: Response) {
    try {
      const { goalId, propertyId } = req.params
      const userId = req.userId!
      const data = req.body

      const property = await houseService.updateSavedProperty(propertyId, goalId, userId, data)
      res.json(property)
    } catch (error: any) {
      console.error('Error updating saved property:', error)
      if (error.message?.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({ error: 'Failed to update saved property' })
    }
  },

  async deleteSavedProperty(req: AuthRequest, res: Response) {
    try {
      const { goalId, propertyId } = req.params
      const userId = req.userId!

      await houseService.deleteSavedProperty(propertyId, goalId, userId)
      res.status(204).send()
    } catch (error: any) {
      console.error('Error deleting saved property:', error)
      if (error.message?.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({ error: 'Failed to delete saved property' })
    }
  },

  // ==========================================
  // Mortgage Calculator
  // ==========================================

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
        return res.status(400).json({
          error: 'Required fields: homePrice, downPaymentPercent, interestRate, loanTermYears',
        })
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
      res.status(500).json({ error: 'Failed to calculate mortgage' })
    }
  },

  // ==========================================
  // AI Insights
  // ==========================================

  async getMarketInsight(req: AuthRequest, res: Response) {
    try {
      const { location, questionType, additionalContext, propertyType, priceRange } = req.body

      if (!location || !questionType) {
        return res.status(400).json({
          error: 'Required fields: location, questionType',
        })
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
      res.status(500).json({ error: 'Failed to get market insight' })
    }
  },

  // ==========================================
  // Provider Status
  // ==========================================

  async getProviderStatus(_req: AuthRequest, res: Response) {
    try {
      const status = await houseService.getProviderStatus()
      res.json(status)
    } catch (error) {
      console.error('Error getting provider status:', error)
      res.status(500).json({ error: 'Failed to get provider status' })
    }
  },
}
