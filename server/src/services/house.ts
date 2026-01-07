/**
 * @fileoverview House Savings Service
 *
 * Service for managing house savings goals with real estate integration.
 * Features include property search, home valuations, saved properties,
 * and mortgage calculations.
 *
 * @module services/house
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'
import { createRealEstateProvider, createLLMProvider } from '../providers/registry.js'
import type { PropertySearchParams, PropertyListing } from '../providers/real-estate/types.js'
import type { LLMMessage } from '../providers/llm/types.js'
import { REAL_ESTATE_PROMPTS } from '../providers/llm/types.js'

const logger = createLogger('house-service')

/**
 * Input for creating a house goal configuration
 */
export interface CreateHouseGoalInput {
  targetPrice: number
  targetLocation?: string
  targetBedrooms?: number
  targetBathrooms?: number
  downPaymentPct?: number
  propertyType?: string
}

/**
 * Input for updating a house goal configuration
 */
export interface UpdateHouseGoalInput {
  targetPrice?: number
  targetLocation?: string
  targetBedrooms?: number
  targetBathrooms?: number
  downPaymentPct?: number
  propertyType?: string
  savedSearches?: object[]
}

/**
 * Input for saving a property snapshot
 */
export interface SavePropertyInput {
  zpid?: string
  address: string
  city: string
  state: string
  zipCode: string
  price: number
  bedrooms?: number
  bathrooms?: number
  sqft?: number
  yearBuilt?: number
  propertyType?: string
  zestimate?: number
  imageUrl?: string
  listingUrl?: string
  notes?: string
}

/**
 * Mortgage calculation parameters
 */
export interface MortgageParams {
  homePrice: number
  downPaymentPct: number
  interestRate: number
  loanTermYears: number
  propertyTaxRate?: number    // Annual rate (e.g., 0.012 for 1.2%)
  insuranceRate?: number      // Annual rate (e.g., 0.0035 for 0.35%)
  pmiRate?: number            // PMI rate if down payment < 20%
  hoaMonthly?: number
}

/**
 * House savings service
 */
export const houseService = {
  // ==========================================
  // House Goal Configuration
  // ==========================================

  /**
   * Get house goal configuration for a savings goal
   */
  async getHouseGoal(goalId: string, userId: string) {
    logger.debug('Fetching house goal', { goalId, userId })

    // Verify the parent goal exists and belongs to user
    const savingsGoal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
    })

    if (!savingsGoal) {
      throw AppError.notFound('House savings goal', goalId)
    }

    return prisma.houseGoal.findUnique({
      where: { goalId },
      include: {
        savedProperties: {
          orderBy: { capturedAt: 'desc' },
        },
        goal: {
          select: {
            name: true,
            targetAmount: true,
            currentAmount: true,
            deadline: true,
          },
        },
      },
    })
  },

  /**
   * Create house goal configuration for an existing savings goal
   */
  async createHouseGoal(goalId: string, userId: string, data: CreateHouseGoalInput) {
    logger.info('Creating house goal config', { goalId, userId })

    // Verify the parent goal exists and belongs to user
    const savingsGoal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
    })

    if (!savingsGoal) {
      throw AppError.notFound('House savings goal', goalId)
    }

    // Check if house goal already exists
    const existing = await prisma.houseGoal.findUnique({
      where: { goalId },
    })

    if (existing) {
      throw AppError.conflict('House goal configuration already exists')
    }

    const houseGoal = await prisma.houseGoal.create({
      data: {
        goalId,
        targetPrice: data.targetPrice,
        targetLocation: data.targetLocation,
        targetBedrooms: data.targetBedrooms,
        targetBathrooms: data.targetBathrooms,
        downPaymentPct: data.downPaymentPct ?? 20,
        propertyType: data.propertyType,
      },
    })

    logger.info('House goal created', { houseGoalId: houseGoal.id, goalId })
    return houseGoal
  },

  /**
   * Update house goal configuration
   */
  async updateHouseGoal(goalId: string, userId: string, data: UpdateHouseGoalInput) {
    logger.info('Updating house goal', { goalId, userId })

    const houseGoal = await this.getHouseGoal(goalId, userId)
    if (!houseGoal) {
      throw AppError.notFound('House goal configuration', goalId)
    }

    const updated = await prisma.houseGoal.update({
      where: { goalId },
      data: {
        ...data,
        savedSearches: data.savedSearches as Prisma.JsonArray | undefined,
      },
    })

    logger.info('House goal updated', { goalId })
    return updated
  },

  // ==========================================
  // Property Search & Valuation
  // ==========================================

  /**
   * Search for properties using the configured real estate provider
   */
  async searchProperties(params: PropertySearchParams) {
    logger.info('Searching properties', { location: params.location })

    const provider = await createRealEstateProvider()
    
    try {
      const properties = await provider.searchProperties(params)
      logger.debug('Properties found', { count: properties.length })
      return properties
    } catch (error) {
      logger.error('Property search failed', { error })
      throw AppError.serviceUnavailable('Property search failed. Please try again later.')
    }
  },

  /**
   * Get detailed information about a specific property
   */
  async getPropertyDetails(propertyId: string) {
    logger.debug('Fetching property details', { propertyId })

    const provider = await createRealEstateProvider()
    
    try {
      const details = await provider.getPropertyDetails(propertyId)
      if (!details) {
        throw AppError.notFound('Property', propertyId)
      }
      return details
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Property details fetch failed', { error })
      throw AppError.serviceUnavailable('Failed to fetch property details.')
    }
  },

  /**
   * Get home valuation estimate for an address
   */
  async getHomeValuation(address: string) {
    logger.info('Getting home valuation', { address })

    const provider = await createRealEstateProvider()
    
    try {
      const valuation = await provider.getHomeValuation(address)
      if (!valuation) {
        logger.warn('Valuation not available', { address })
        return null
      }
      return valuation
    } catch (error) {
      logger.error('Valuation failed', { error })
      throw AppError.serviceUnavailable('Valuation service unavailable.')
    }
  },

  // ==========================================
  // Saved Properties
  // ==========================================

  /**
   * Save a property to the user's house goal
   */
  async saveProperty(goalId: string, userId: string, data: SavePropertyInput) {
    logger.info('Saving property snapshot', { goalId, address: data.address })

    const houseGoal = await this.getHouseGoal(goalId, userId)
    if (!houseGoal) {
      throw AppError.notFound('House goal configuration', goalId)
    }

    const snapshot = await prisma.propertySnapshot.create({
      data: {
        houseGoalId: houseGoal.id,
        zpid: data.zpid,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft,
        yearBuilt: data.yearBuilt,
        propertyType: data.propertyType,
        zestimate: data.zestimate,
        imageUrl: data.imageUrl,
        listingUrl: data.listingUrl,
        notes: data.notes,
      },
    })

    logger.info('Property saved', { snapshotId: snapshot.id })
    return snapshot
  },

  /**
   * Get all saved properties for a house goal
   */
  async getSavedProperties(goalId: string, userId: string) {
    logger.debug('Fetching saved properties', { goalId })

    const houseGoal = await this.getHouseGoal(goalId, userId)
    if (!houseGoal) {
      throw AppError.notFound('House goal configuration', goalId)
    }

    return prisma.propertySnapshot.findMany({
      where: { houseGoalId: houseGoal.id },
      orderBy: [{ isFavorite: 'desc' }, { capturedAt: 'desc' }],
    })
  },

  /**
   * Toggle favorite status of a saved property
   */
  async togglePropertyFavorite(propertyId: string, goalId: string, userId: string) {
    logger.debug('Toggling property favorite', { propertyId })

    // Verify ownership through house goal
    const houseGoal = await this.getHouseGoal(goalId, userId)
    if (!houseGoal) {
      throw AppError.notFound('House goal configuration', goalId)
    }

    const property = await prisma.propertySnapshot.findFirst({
      where: { id: propertyId, houseGoalId: houseGoal.id },
    })

    if (!property) {
      throw AppError.notFound('Saved property', propertyId)
    }

    return prisma.propertySnapshot.update({
      where: { id: propertyId },
      data: { isFavorite: !property.isFavorite },
    })
  },

  /**
   * Update notes on a saved property
   */
  async updatePropertyNotes(propertyId: string, goalId: string, userId: string, notes: string) {
    logger.debug('Updating property notes', { propertyId })

    const houseGoal = await this.getHouseGoal(goalId, userId)
    if (!houseGoal) {
      throw AppError.notFound('House goal configuration', goalId)
    }

    const property = await prisma.propertySnapshot.findFirst({
      where: { id: propertyId, houseGoalId: houseGoal.id },
    })

    if (!property) {
      throw AppError.notFound('Saved property', propertyId)
    }

    return prisma.propertySnapshot.update({
      where: { id: propertyId },
      data: { notes },
    })
  },

  /**
   * Delete a saved property
   */
  async deleteProperty(propertyId: string, goalId: string, userId: string) {
    logger.info('Deleting saved property', { propertyId })

    const houseGoal = await this.getHouseGoal(goalId, userId)
    if (!houseGoal) {
      throw AppError.notFound('House goal configuration', goalId)
    }

    const property = await prisma.propertySnapshot.findFirst({
      where: { id: propertyId, houseGoalId: houseGoal.id },
    })

    if (!property) {
      throw AppError.notFound('Saved property', propertyId)
    }

    await prisma.propertySnapshot.delete({
      where: { id: propertyId },
    })

    logger.info('Property deleted', { propertyId })
    return property
  },

  // ==========================================
  // Mortgage Calculator
  // ==========================================

  /**
   * Calculate mortgage payments and related costs
   */
  calculateMortgage(params: MortgageParams) {
    const {
      homePrice,
      downPaymentPct,
      interestRate,
      loanTermYears,
      propertyTaxRate = 0.012,  // Default 1.2%
      insuranceRate = 0.0035,   // Default 0.35%
      pmiRate = 0.005,          // Default 0.5% if applicable
      hoaMonthly = 0,
    } = params

    // Calculate down payment and loan amount
    const downPayment = homePrice * (downPaymentPct / 100)
    const loanAmount = homePrice - downPayment

    // Monthly interest rate
    const monthlyRate = interestRate / 100 / 12
    const numPayments = loanTermYears * 12

    // Calculate principal + interest using amortization formula
    let monthlyPI: number
    if (monthlyRate === 0) {
      monthlyPI = loanAmount / numPayments
    } else {
      monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1)
    }

    // Monthly property tax
    const monthlyTax = (homePrice * propertyTaxRate) / 12

    // Monthly insurance
    const monthlyInsurance = (homePrice * insuranceRate) / 12

    // PMI (if down payment < 20%)
    const monthlyPMI = downPaymentPct < 20 ? (loanAmount * pmiRate) / 12 : 0

    // Total monthly payment (PITI + PMI + HOA)
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + hoaMonthly

    // Total paid over life of loan
    const totalPaid = (monthlyPI * numPayments) + (monthlyTax * numPayments) + 
                      (monthlyInsurance * numPayments) + (hoaMonthly * numPayments)
    
    // Total interest paid
    const totalInterest = (monthlyPI * numPayments) - loanAmount

    return {
      homePrice,
      downPayment: Math.round(downPayment),
      loanAmount: Math.round(loanAmount),
      monthlyPayment: {
        principalAndInterest: Math.round(monthlyPI),
        propertyTax: Math.round(monthlyTax),
        insurance: Math.round(monthlyInsurance),
        pmi: Math.round(monthlyPMI),
        hoa: hoaMonthly,
        total: Math.round(totalMonthly),
      },
      totalPaid: Math.round(totalPaid),
      totalInterest: Math.round(totalInterest),
      loanTermMonths: numPayments,
      effectiveRate: interestRate,
    }
  },

  // ==========================================
  // AI Insights
  // ==========================================

  /**
   * Get AI-powered market insights for a location
   */
  async getMarketInsights(location: string, priceRange?: { min?: number; max?: number }) {
    logger.info('Getting market insights', { location })

    const llmProvider = await createLLMProvider()
    const isAvailable = await llmProvider.isAvailable()

    if (!isAvailable) {
      logger.warn('LLM provider not available')
      return {
        available: false,
        message: 'AI insights are not configured. Set up an LLM provider in your .env file.',
      }
    }

    try {
      const prompt = REAL_ESTATE_PROMPTS.marketAnalysis(location, priceRange)
      const messages: LLMMessage[] = [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ]

      const response = await llmProvider.complete({ messages, temperature: 0.7 })

      return {
        available: true,
        content: response.content,
        model: response.model,
        usage: response.usage,
      }
    } catch (error) {
      logger.error('Market insights failed', { error })
      return {
        available: false,
        message: 'Failed to generate insights. Please try again later.',
      }
    }
  },

  /**
   * Get AI evaluation of a specific property
   */
  async getPropertyInsight(property: PropertyListing) {
    logger.info('Getting property insight', { address: property.address })

    const llmProvider = await createLLMProvider()
    const isAvailable = await llmProvider.isAvailable()

    if (!isAvailable) {
      return {
        available: false,
        message: 'AI insights are not configured.',
      }
    }

    try {
      const prompt = REAL_ESTATE_PROMPTS.propertyEvaluation({
        address: property.address,
        price: property.price,
        sqft: property.sqft,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        yearBuilt: property.yearBuilt,
      })

      const messages: LLMMessage[] = [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ]

      const response = await llmProvider.complete({ messages, temperature: 0.7 })

      return {
        available: true,
        content: response.content,
        model: response.model,
      }
    } catch (error) {
      logger.error('Property insight failed', { error })
      return {
        available: false,
        message: 'Failed to generate property insight.',
      }
    }
  },

  /**
   * Check provider availability
   */
  async checkProviderStatus() {
    const realEstateProvider = await createRealEstateProvider()
    const llmProvider = await createLLMProvider()

    return {
      realEstate: {
        name: realEstateProvider.name,
        available: await realEstateProvider.isAvailable(),
      },
      llm: {
        name: llmProvider.name,
        available: await llmProvider.isAvailable(),
      },
    }
  },
}
