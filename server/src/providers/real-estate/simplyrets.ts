/**
 * SimplyRETS Real Estate Provider
 *
 * Uses SimplyRETS demo API - no API key required!
 * Demo credentials: simplyrets:simplyrets
 *
 * Docs: https://docs.simplyrets.com/api/index.html
 */

import {
  RealEstateProvider,
  PropertySearchParams,
  PropertyListing,
  PropertyType,
  HomeValuation,
  MortgageParams,
  MortgageCalculation,
} from './types.js'

interface SimplyRetsProperty {
  mlsId: number
  address: {
    streetNumber: string
    streetName: string
    streetSuffix?: string
    city: string
    state: string
    postalCode: string
    full: string
  }
  listPrice: number
  property: {
    bedrooms: number
    bathsFull: number
    bathsHalf: number
    area: number
    yearBuilt?: number
    type?: string
    subType?: string
    lotSize?: string
  }
  photos: string[]
  listDate: string
  geo?: {
    lat: number
    lng: number
  }
  remarks?: string
  virtualTourUrl?: string
  mls: {
    status: string
    daysOnMarket: number
  }
}

export class SimplyRetsProvider implements RealEstateProvider {
  name = 'SimplyRETS Demo'
  private baseUrl = 'https://api.simplyrets.com'
  // Demo credentials - publicly available for testing
  private auth = Buffer.from('simplyrets:simplyrets').toString('base64')

  async searchProperties(params: PropertySearchParams): Promise<PropertyListing[]> {
    const queryParams = new URLSearchParams()

    // SimplyRETS uses different param names
    if (params.minPrice) queryParams.set('minprice', params.minPrice.toString())
    if (params.maxPrice) queryParams.set('maxprice', params.maxPrice.toString())
    if (params.bedrooms) queryParams.set('minbeds', params.bedrooms.toString())
    if (params.bathrooms) queryParams.set('minbaths', params.bathrooms.toString())
    if (params.limit) queryParams.set('limit', params.limit.toString())

    // Location search - try to parse city/state or use as search term
    if (params.location) {
      // Check if it looks like "City, State" format
      const parts = params.location.split(',').map((p) => p.trim())
      if (parts.length >= 1) {
        queryParams.set('cities', parts[0])
      }
    }

    // Property type mapping
    if (params.propertyType) {
      const typeMap: Record<string, string> = {
        single_family: 'Residential',
        condo: 'Condominium',
        townhouse: 'Residential',
        multi_family: 'Multifamily',
        apartment: 'Rental',
      }
      const mappedType = typeMap[params.propertyType]
      if (mappedType) {
        queryParams.set('type', mappedType)
      }
    }

    queryParams.set('status', 'Active')

    try {
      const response = await fetch(`${this.baseUrl}/properties?${queryParams}`, {
        headers: {
          Authorization: `Basic ${this.auth}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        console.error('SimplyRETS API error:', response.status, response.statusText)
        return []
      }

      const data = (await response.json()) as SimplyRetsProperty[]
      return data.map((p) => this.mapProperty(p))
    } catch (error) {
      console.error('SimplyRETS search error:', error)
      return []
    }
  }

  async getPropertyDetails(propertyId: string): Promise<PropertyListing | null> {
    try {
      const response = await fetch(`${this.baseUrl}/properties/${propertyId}`, {
        headers: {
          Authorization: `Basic ${this.auth}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        return null
      }

      const data = (await response.json()) as SimplyRetsProperty
      return {
        ...this.mapProperty(data),
        description: data.remarks || undefined,
      }
    } catch (error) {
      console.error('SimplyRETS details error:', error)
      return null
    }
  }

  async getHomeValuation(address: string): Promise<HomeValuation | null> {
    // SimplyRETS doesn't provide valuations - return mock estimate
    // In production, you'd use a different service for this
    const hash = this.simpleHash(address)
    const baseValue = 350000 + (hash % 500000)
    const variance = baseValue * 0.1

    return {
      address,
      zestimate: baseValue,
      rentZestimate: Math.round(baseValue * 0.005),
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
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/properties?limit=1`, {
        headers: {
          Authorization: `Basic ${this.auth}`,
          Accept: 'application/json',
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

  private mapProperty(p: SimplyRetsProperty): PropertyListing {
    const totalBaths = p.property.bathsFull + p.property.bathsHalf * 0.5

    // Map SimplyRETS property type to our types
    let propertyType: PropertyType = 'single_family'
    if (p.property.type === 'Condominium' || p.property.subType?.includes('Condo')) {
      propertyType = 'condo'
    } else if (p.property.subType?.includes('Townhouse')) {
      propertyType = 'townhouse'
    } else if (p.property.type === 'Multifamily') {
      propertyType = 'multi_family'
    }

    return {
      id: p.mlsId.toString(),
      address: p.address.full,
      city: p.address.city,
      state: p.address.state,
      zipCode: p.address.postalCode,
      price: p.listPrice,
      bedrooms: p.property.bedrooms,
      bathrooms: totalBaths,
      sqft: p.property.area,
      yearBuilt: p.property.yearBuilt,
      propertyType,
      imageUrl: p.photos?.[0] || undefined,
      listingUrl: p.virtualTourUrl || undefined,
      latitude: p.geo?.lat,
      longitude: p.geo?.lng,
      daysOnMarket: p.mls.daysOnMarket,
      pricePerSqft: p.property.area > 0 ? Math.round(p.listPrice / p.property.area) : undefined,
    }
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
}
