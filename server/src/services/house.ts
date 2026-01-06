import { prisma } from '../lib/prisma.js'
import {
  createRealEstateProvider,
  createLLMProvider,
  getProviderStatus,
} from '../providers/registry.js'
import {
  PropertySearchParams,
  PropertyListing,
  HomeValuation,
  MortgageParams,
  MortgageCalculation,
} from '../providers/real-estate/types.js'
import { MarketInsightRequest, MarketInsight } from '../providers/llm/types.js'
import { Decimal } from '@prisma/client/runtime/library'

export interface CreateHouseGoalInput {
  targetPrice: number
  targetLocation?: string
  targetBedrooms?: number
  targetBathrooms?: number
  downPaymentPct?: number
  propertyType?: string
}

export interface UpdateHouseGoalInput {
  targetPrice?: number
  targetLocation?: string
  targetBedrooms?: number
  targetBathrooms?: number
  downPaymentPct?: number
  propertyType?: string
}

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

// Initialize providers lazily
let realEstateProvider: Awaited<ReturnType<typeof createRealEstateProvider>> | null = null
let llmProvider: Awaited<ReturnType<typeof createLLMProvider>> | null = null

async function getRealEstateProvider() {
  if (!realEstateProvider) {
    realEstateProvider = await createRealEstateProvider()
  }
  return realEstateProvider
}

async function getLLMProvider() {
  if (!llmProvider) {
    llmProvider = await createLLMProvider()
  }
  return llmProvider
}

export const houseService = {
  // ==========================================
  // House Goal CRUD
  // ==========================================

  async getHouseGoal(goalId: string, userId: string) {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
      include: {
        houseGoal: {
          include: {
            savedProperties: {
              orderBy: { capturedAt: 'desc' },
            },
          },
        },
      },
    })

    if (!goal) return null
    return goal
  },

  async createHouseGoal(goalId: string, userId: string, data: CreateHouseGoalInput) {
    // Verify the goal exists and is a HOUSE type
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
    })

    if (!goal) {
      throw new Error('Goal not found or is not a house goal')
    }

    // Check if house goal config already exists
    const existing = await prisma.houseGoal.findUnique({
      where: { goalId },
    })

    if (existing) {
      throw new Error('House goal configuration already exists')
    }

    const houseGoal = await prisma.houseGoal.create({
      data: {
        goalId,
        targetPrice: new Decimal(data.targetPrice),
        targetLocation: data.targetLocation,
        targetBedrooms: data.targetBedrooms,
        targetBathrooms: data.targetBathrooms,
        downPaymentPct: data.downPaymentPct ?? 20,
        propertyType: data.propertyType,
      },
      include: {
        savedProperties: true,
      },
    })

    return houseGoal
  },

  async updateHouseGoal(goalId: string, userId: string, data: UpdateHouseGoalInput) {
    // Verify ownership
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
    })

    if (!goal) {
      throw new Error('Goal not found or is not a house goal')
    }

    const houseGoal = await prisma.houseGoal.update({
      where: { goalId },
      data: {
        ...(data.targetPrice !== undefined && { targetPrice: new Decimal(data.targetPrice) }),
        ...(data.targetLocation !== undefined && { targetLocation: data.targetLocation }),
        ...(data.targetBedrooms !== undefined && { targetBedrooms: data.targetBedrooms }),
        ...(data.targetBathrooms !== undefined && { targetBathrooms: data.targetBathrooms }),
        ...(data.downPaymentPct !== undefined && { downPaymentPct: data.downPaymentPct }),
        ...(data.propertyType !== undefined && { propertyType: data.propertyType }),
      },
      include: {
        savedProperties: true,
      },
    })

    return houseGoal
  },

  // ==========================================
  // Property Search & Details
  // ==========================================

  async searchProperties(params: PropertySearchParams): Promise<PropertyListing[]> {
    const provider = await getRealEstateProvider()
    return provider.searchProperties(params)
  },

  async getPropertyDetails(propertyId: string): Promise<PropertyListing | null> {
    const provider = await getRealEstateProvider()
    return provider.getPropertyDetails(propertyId)
  },

  async getHomeValuation(address: string): Promise<HomeValuation | null> {
    const provider = await getRealEstateProvider()
    return provider.getHomeValuation(address)
  },

  // ==========================================
  // Saved Properties
  // ==========================================

  async getSavedProperties(goalId: string, userId: string) {
    // Verify ownership
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
      include: { houseGoal: true },
    })

    if (!goal?.houseGoal) {
      throw new Error('House goal not found')
    }

    const properties = await prisma.propertySnapshot.findMany({
      where: { houseGoalId: goal.houseGoal.id },
      orderBy: [{ isFavorite: 'desc' }, { capturedAt: 'desc' }],
    })

    return properties
  },

  async saveProperty(goalId: string, userId: string, data: SavePropertyInput) {
    // Verify ownership
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
      include: { houseGoal: true },
    })

    if (!goal?.houseGoal) {
      throw new Error('House goal not found')
    }

    const property = await prisma.propertySnapshot.create({
      data: {
        houseGoalId: goal.houseGoal.id,
        zpid: data.zpid,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        price: new Decimal(data.price),
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft,
        yearBuilt: data.yearBuilt,
        propertyType: data.propertyType,
        zestimate: data.zestimate ? new Decimal(data.zestimate) : null,
        imageUrl: data.imageUrl,
        listingUrl: data.listingUrl,
        notes: data.notes,
      },
    })

    return property
  },

  async updateSavedProperty(
    propertyId: string,
    goalId: string,
    userId: string,
    data: { isFavorite?: boolean; notes?: string }
  ) {
    // Verify ownership
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
      include: { houseGoal: true },
    })

    if (!goal?.houseGoal) {
      throw new Error('House goal not found')
    }

    const property = await prisma.propertySnapshot.updateMany({
      where: {
        id: propertyId,
        houseGoalId: goal.houseGoal.id,
      },
      data,
    })

    if (property.count === 0) {
      throw new Error('Property not found')
    }

    return prisma.propertySnapshot.findUnique({
      where: { id: propertyId },
    })
  },

  async deleteSavedProperty(propertyId: string, goalId: string, userId: string) {
    // Verify ownership
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
      include: { houseGoal: true },
    })

    if (!goal?.houseGoal) {
      throw new Error('House goal not found')
    }

    const result = await prisma.propertySnapshot.deleteMany({
      where: {
        id: propertyId,
        houseGoalId: goal.houseGoal.id,
      },
    })

    if (result.count === 0) {
      throw new Error('Property not found')
    }

    return { deleted: true }
  },

  // ==========================================
  // Mortgage Calculator
  // ==========================================

  calculateMortgage(params: MortgageParams): MortgageCalculation {
    // Use the provider's mortgage calculation (pure math, works offline)
    const provider = realEstateProvider
    if (provider) {
      return provider.calculateMortgage(params)
    }

    // Fallback calculation if provider not yet initialized
    const {
      homePrice,
      downPaymentPercent,
      interestRate,
      loanTermYears,
      propertyTaxRate = 0.0125,
      homeInsuranceRate = 0.0035,
      pmiRate = 0.005,
    } = params

    const downPayment = homePrice * (downPaymentPercent / 100)
    const loanAmount = homePrice - downPayment
    const monthlyRate = interestRate / 100 / 12
    const numPayments = loanTermYears * 12

    let monthlyPI: number
    if (monthlyRate === 0) {
      monthlyPI = loanAmount / numPayments
    } else {
      monthlyPI =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
    }

    const monthlyPropertyTax = (homePrice * propertyTaxRate) / 12
    const monthlyInsurance = (homePrice * homeInsuranceRate) / 12
    const monthlyPMI = downPaymentPercent < 20 ? (loanAmount * pmiRate) / 12 : 0
    const firstMonthInterest = loanAmount * monthlyRate
    const firstMonthPrincipal = monthlyPI - firstMonthInterest
    const monthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI
    const totalPayment = monthlyPayment * numPayments
    const totalInterest = monthlyPI * numPayments - loanAmount

    return {
      homePrice,
      downPayment,
      downPaymentPercent,
      loanAmount,
      interestRate,
      loanTermYears,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      monthlyBreakdown: {
        principal: Math.round(firstMonthPrincipal * 100) / 100,
        interest: Math.round(firstMonthInterest * 100) / 100,
        propertyTax: Math.round(monthlyPropertyTax * 100) / 100,
        homeInsurance: Math.round(monthlyInsurance * 100) / 100,
        pmi: monthlyPMI > 0 ? Math.round(monthlyPMI * 100) / 100 : undefined,
      },
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    }
  },

  // ==========================================
  // AI Insights
  // ==========================================

  async getMarketInsight(request: MarketInsightRequest): Promise<MarketInsight> {
    const provider = await getLLMProvider()
    return provider.getMarketInsight(request)
  },

  // ==========================================
  // Provider Status
  // ==========================================

  async getProviderStatus() {
    return getProviderStatus()
  },

  // ==========================================
  // House Goal Summary
  // ==========================================

  async getHouseGoalSummary(goalId: string, userId: string) {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId, type: 'HOUSE' },
      include: {
        houseGoal: {
          include: {
            savedProperties: true,
          },
        },
      },
    })

    if (!goal?.houseGoal) {
      return null
    }

    const houseGoal = goal.houseGoal
    const targetPrice = Number(houseGoal.targetPrice)
    const currentSaved = Number(goal.currentAmount)
    const downPaymentAmount = targetPrice * (houseGoal.downPaymentPct / 100)
    const progressToDownPayment = downPaymentAmount > 0 ? (currentSaved / downPaymentAmount) * 100 : 0
    const remainingForDownPayment = Math.max(0, downPaymentAmount - currentSaved)

    // Calculate mortgage info based on target price
    const mortgageEstimate = this.calculateMortgage({
      homePrice: targetPrice,
      downPaymentPercent: houseGoal.downPaymentPct,
      interestRate: 6.5, // Default current rate estimate
      loanTermYears: 30,
    })

    return {
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        currentAmount: currentSaved,
        deadline: goal.deadline,
        isCompleted: goal.isCompleted,
      },
      houseDetails: {
        targetPrice,
        targetLocation: houseGoal.targetLocation,
        targetBedrooms: houseGoal.targetBedrooms,
        targetBathrooms: houseGoal.targetBathrooms,
        downPaymentPct: houseGoal.downPaymentPct,
        propertyType: houseGoal.propertyType,
      },
      progress: {
        downPaymentAmount,
        currentSaved,
        remainingForDownPayment,
        progressPercent: Math.min(progressToDownPayment, 100),
      },
      mortgageEstimate,
      savedProperties: {
        total: houseGoal.savedProperties.length,
        favorites: houseGoal.savedProperties.filter((p) => p.isFavorite).length,
      },
    }
  },
}
