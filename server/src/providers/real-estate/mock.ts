/**
 * Mock Real Estate Provider
 *
 * Returns fake data for testing and development.
 * No API key required.
 */

import {
  RealEstateProvider,
  PropertySearchParams,
  PropertyListing,
  HomeValuation,
  MortgageParams,
  MortgageCalculation,
} from './types.js'

// Sample mock properties for testing
const MOCK_PROPERTIES: PropertyListing[] = [
  {
    id: 'mock-1',
    address: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    price: 450000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1850,
    yearBuilt: 2018,
    propertyType: 'single_family',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    listingUrl: 'https://example.com/property/mock-1',
    latitude: 30.2672,
    longitude: -97.7431,
    lotSize: 6500,
    daysOnMarket: 14,
    pricePerSqft: 243,
  },
  {
    id: 'mock-2',
    address: '456 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
    price: 625000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    yearBuilt: 2015,
    propertyType: 'single_family',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    listingUrl: 'https://example.com/property/mock-2',
    latitude: 30.2449,
    longitude: -97.7544,
    lotSize: 8000,
    daysOnMarket: 7,
    pricePerSqft: 260,
  },
  {
    id: 'mock-3',
    address: '789 Downtown Lofts #402',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    price: 385000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    yearBuilt: 2020,
    propertyType: 'condo',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    listingUrl: 'https://example.com/property/mock-3',
    latitude: 30.2627,
    longitude: -97.7251,
    lotSize: 0,
    daysOnMarket: 21,
    pricePerSqft: 320,
  },
  {
    id: 'mock-4',
    address: '101 Suburban Drive',
    city: 'Round Rock',
    state: 'TX',
    zipCode: '78664',
    price: 525000,
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2800,
    yearBuilt: 2019,
    propertyType: 'single_family',
    imageUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
    listingUrl: 'https://example.com/property/mock-4',
    latitude: 30.5083,
    longitude: -97.6789,
    lotSize: 10000,
    daysOnMarket: 3,
    pricePerSqft: 187,
  },
  {
    id: 'mock-5',
    address: '222 Lakeside Terrace',
    city: 'Lakeway',
    state: 'TX',
    zipCode: '78734',
    price: 875000,
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3600,
    yearBuilt: 2021,
    propertyType: 'single_family',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    listingUrl: 'https://example.com/property/mock-5',
    latitude: 30.3628,
    longitude: -97.9944,
    lotSize: 15000,
    daysOnMarket: 30,
    pricePerSqft: 243,
  },
  {
    id: 'mock-6',
    address: '333 Historic District Lane',
    city: 'Georgetown',
    state: 'TX',
    zipCode: '78626',
    price: 395000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1650,
    yearBuilt: 1995,
    propertyType: 'townhouse',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    listingUrl: 'https://example.com/property/mock-6',
    latitude: 30.6333,
    longitude: -97.6778,
    lotSize: 3000,
    daysOnMarket: 45,
    pricePerSqft: 239,
  },
]

export class MockRealEstateProvider implements RealEstateProvider {
  name = 'Mock Provider'

  async searchProperties(params: PropertySearchParams): Promise<PropertyListing[]> {
    // Simulate network delay
    await this.simulateDelay()

    let results = [...MOCK_PROPERTIES]

    // Filter by location (simple string match)
    if (params.location) {
      const locationLower = params.location.toLowerCase()
      results = results.filter(
        (p) =>
          p.city.toLowerCase().includes(locationLower) ||
          p.state.toLowerCase().includes(locationLower) ||
          p.zipCode.includes(params.location)
      )
    }

    // Filter by price range
    if (params.minPrice) {
      results = results.filter((p) => p.price >= params.minPrice!)
    }
    if (params.maxPrice) {
      results = results.filter((p) => p.price <= params.maxPrice!)
    }

    // Filter by bedrooms
    if (params.bedrooms) {
      results = results.filter((p) => p.bedrooms >= params.bedrooms!)
    }

    // Filter by bathrooms
    if (params.bathrooms) {
      results = results.filter((p) => p.bathrooms >= params.bathrooms!)
    }

    // Filter by property type
    if (params.propertyType) {
      results = results.filter((p) => p.propertyType === params.propertyType)
    }

    // Limit results
    const limit = params.limit || 20
    return results.slice(0, limit)
  }

  async getPropertyDetails(propertyId: string): Promise<PropertyListing | null> {
    await this.simulateDelay()

    const property = MOCK_PROPERTIES.find((p) => p.id === propertyId)
    if (!property) return null

    // Return with additional details
    return {
      ...property,
      description: `Beautiful ${property.bedrooms} bedroom, ${property.bathrooms} bathroom ${property.propertyType.replace('_', ' ')} in ${property.city}. Built in ${property.yearBuilt}, this ${property.sqft} sq ft home features modern amenities and a great location. This is mock data for testing purposes.`,
    }
  }

  async getHomeValuation(address: string): Promise<HomeValuation | null> {
    await this.simulateDelay()

    // Generate mock valuation based on address hash
    const hash = this.simpleHash(address)
    const baseValue = 350000 + (hash % 500000)
    const variance = baseValue * 0.1

    return {
      address,
      zestimate: baseValue,
      rentZestimate: Math.round(baseValue * 0.005), // ~0.5% of value as monthly rent
      valueRange: {
        low: Math.round(baseValue - variance),
        high: Math.round(baseValue + variance),
      },
      lastUpdated: new Date().toISOString(),
      taxAssessment: Math.round(baseValue * 0.85),
      yearBuilt: 2010 + (hash % 14),
      sqft: 1500 + (hash % 2000),
    }
  }

  calculateMortgage(params: MortgageParams): MortgageCalculation {
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

    // Monthly interest rate
    const monthlyRate = interestRate / 100 / 12
    const numPayments = loanTermYears * 12

    // Calculate monthly principal + interest using amortization formula
    let monthlyPI: number
    if (monthlyRate === 0) {
      monthlyPI = loanAmount / numPayments
    } else {
      monthlyPI =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
    }

    // Monthly property tax
    const monthlyPropertyTax = (homePrice * propertyTaxRate) / 12

    // Monthly home insurance
    const monthlyInsurance = (homePrice * homeInsuranceRate) / 12

    // PMI (if down payment < 20%)
    const monthlyPMI = downPaymentPercent < 20 ? (loanAmount * pmiRate) / 12 : 0

    // Calculate interest portion of first payment (for breakdown)
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
  }

  async isAvailable(): Promise<boolean> {
    // Mock provider is always available
    return true
  }

  private async simulateDelay(): Promise<void> {
    // Simulate 100-300ms network delay
    const delay = 100 + Math.random() * 200
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}
