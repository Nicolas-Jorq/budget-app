/**
 * RapidAPI Zillow Provider
 *
 * Real estate data from Zillow via RapidAPI.
 *
 * API Documentation: https://rapidapi.com/apimaker/api/zillow-com1
 *
 * Endpoints:
 * - GET /propertyExtendedSearch - Search properties by location
 * - GET /property - Get property details by zpid
 * - GET /zestimate - Get home valuation by zpid
 *
 * Required Environment Variables:
 * - RAPIDAPI_KEY: Your RapidAPI key
 * - RAPIDAPI_HOST: zillow-com1.p.rapidapi.com (default)
 *
 * Rate Limits (Free Tier):
 * - 100 requests/month
 */

import {
  RealEstateProvider,
  PropertySearchParams,
  PropertyListing,
  HomeValuation,
  MortgageParams,
  MortgageCalculation,
  PropertyType,
} from './types.js'
import { MockRealEstateProvider } from './mock.js'

// Use the mock provider's mortgage calculation (it's pure math, no API needed)
const mockProvider = new MockRealEstateProvider()

interface ZillowSearchResult {
  zpid: string
  address: {
    streetAddress: string
    city: string
    state: string
    zipcode: string
  }
  price: number
  bedrooms: number
  bathrooms: number
  livingArea: number
  yearBuilt?: number
  homeType: string
  imgSrc?: string
  detailUrl?: string
  latitude?: number
  longitude?: number
  lotAreaValue?: number
  daysOnZillow?: number
}

interface ZillowPropertyDetail {
  zpid: string
  address: {
    streetAddress: string
    city: string
    state: string
    zipcode: string
  }
  price: number
  bedrooms: number
  bathrooms: number
  livingArea: number
  yearBuilt?: number
  homeType: string
  imgSrc?: string
  hdpUrl?: string
  latitude?: number
  longitude?: number
  lotSize?: number
  daysOnZillow?: number
  description?: string
  zestimate?: number
}

interface ZillowZestimate {
  zestimate: number
  rentZestimate?: number
  lowValue?: number
  highValue?: number
  lastUpdated?: string
  taxAssessedValue?: number
  yearBuilt?: number
  livingArea?: number
}

export class RapidAPIZillowProvider implements RealEstateProvider {
  name = 'RapidAPI Zillow'

  private baseUrl = 'https://zillow-com1.p.rapidapi.com'
  private host = process.env.RAPIDAPI_HOST || 'zillow-com1.p.rapidapi.com'

  private get apiKey(): string {
    return process.env.RAPIDAPI_KEY || ''
  }

  private get headers(): Record<string, string> {
    return {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': this.host,
    }
  }

  async searchProperties(params: PropertySearchParams): Promise<PropertyListing[]> {
    if (!this.apiKey) {
      console.warn('RAPIDAPI_KEY not set, returning empty results')
      return []
    }

    try {
      const queryParams = new URLSearchParams({
        location: params.location,
        home_type: this.mapPropertyType(params.propertyType),
      })

      if (params.minPrice) {
        queryParams.set('minPrice', params.minPrice.toString())
      }
      if (params.maxPrice) {
        queryParams.set('maxPrice', params.maxPrice.toString())
      }
      if (params.bedrooms) {
        queryParams.set('bedsMin', params.bedrooms.toString())
      }
      if (params.bathrooms) {
        queryParams.set('bathsMin', params.bathrooms.toString())
      }

      const response = await fetch(
        `${this.baseUrl}/propertyExtendedSearch?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: this.headers,
        }
      )

      if (!response.ok) {
        console.error(`Zillow API error: ${response.status} ${response.statusText}`)
        return []
      }

      const data = await response.json() as { props?: ZillowSearchResult[] }
      const properties: ZillowSearchResult[] = data.props || []

      const limit = params.limit || 20
      return properties.slice(0, limit).map((p) => this.mapSearchResult(p))
    } catch (error) {
      console.error('Error searching properties:', error)
      return []
    }
  }

  async getPropertyDetails(propertyId: string): Promise<PropertyListing | null> {
    if (!this.apiKey) {
      console.warn('RAPIDAPI_KEY not set, returning null')
      return null
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/property?zpid=${propertyId}`,
        {
          method: 'GET',
          headers: this.headers,
        }
      )

      if (!response.ok) {
        console.error(`Zillow API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json() as ZillowPropertyDetail
      return this.mapPropertyDetail(data)
    } catch (error) {
      console.error('Error getting property details:', error)
      return null
    }
  }

  async getHomeValuation(address: string): Promise<HomeValuation | null> {
    if (!this.apiKey) {
      console.warn('RAPIDAPI_KEY not set, returning null')
      return null
    }

    try {
      // First, search for the property to get the zpid
      const searchResponse = await fetch(
        `${this.baseUrl}/propertyExtendedSearch?location=${encodeURIComponent(address)}`,
        {
          method: 'GET',
          headers: this.headers,
        }
      )

      if (!searchResponse.ok) {
        console.error(`Zillow API error: ${searchResponse.status} ${searchResponse.statusText}`)
        return null
      }

      const searchData = await searchResponse.json() as { props?: { zpid: string }[] }
      const properties = searchData.props || []

      if (properties.length === 0) {
        return null
      }

      // Get the zpid of the first matching property
      const zpid = properties[0].zpid

      // Now get the zestimate
      const zestimateResponse = await fetch(
        `${this.baseUrl}/zestimate?zpid=${zpid}`,
        {
          method: 'GET',
          headers: this.headers,
        }
      )

      if (!zestimateResponse.ok) {
        console.error(`Zillow API error: ${zestimateResponse.status} ${zestimateResponse.statusText}`)
        return null
      }

      const zestimateData = await zestimateResponse.json() as ZillowZestimate
      return this.mapZestimate(address, zestimateData)
    } catch (error) {
      console.error('Error getting home valuation:', error)
      return null
    }
  }

  calculateMortgage(params: MortgageParams): MortgageCalculation {
    // Use the mock provider's calculation (pure math, no API needed)
    return mockProvider.calculateMortgage(params)
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    try {
      // Make a simple request to check if the API is working
      const response = await fetch(
        `${this.baseUrl}/propertyExtendedSearch?location=austin%2C%20tx&home_type=Houses`,
        {
          method: 'GET',
          headers: this.headers,
        }
      )
      return response.ok
    } catch {
      return false
    }
  }

  private mapPropertyType(type?: PropertyType): string {
    if (!type) return 'Houses'

    const typeMap: Record<PropertyType, string> = {
      single_family: 'Houses',
      condo: 'Condos',
      townhouse: 'Townhomes',
      multi_family: 'Multi-family',
      apartment: 'Apartments',
      land: 'Lots/Land',
      other: 'Houses',
    }

    return typeMap[type] || 'Houses'
  }

  private mapHomeType(homeType: string): PropertyType {
    const homeTypeLower = homeType?.toLowerCase() || ''

    if (homeTypeLower.includes('condo')) return 'condo'
    if (homeTypeLower.includes('townhouse') || homeTypeLower.includes('townhome')) return 'townhouse'
    if (homeTypeLower.includes('multi') || homeTypeLower.includes('duplex')) return 'multi_family'
    if (homeTypeLower.includes('apartment')) return 'apartment'
    if (homeTypeLower.includes('land') || homeTypeLower.includes('lot')) return 'land'

    return 'single_family'
  }

  private mapSearchResult(result: ZillowSearchResult): PropertyListing {
    return {
      id: result.zpid,
      address: result.address.streetAddress,
      city: result.address.city,
      state: result.address.state,
      zipCode: result.address.zipcode,
      price: result.price || 0,
      bedrooms: result.bedrooms || 0,
      bathrooms: result.bathrooms || 0,
      sqft: result.livingArea || 0,
      yearBuilt: result.yearBuilt,
      propertyType: this.mapHomeType(result.homeType),
      imageUrl: result.imgSrc,
      listingUrl: result.detailUrl ? `https://www.zillow.com${result.detailUrl}` : undefined,
      latitude: result.latitude,
      longitude: result.longitude,
      lotSize: result.lotAreaValue,
      daysOnMarket: result.daysOnZillow,
      pricePerSqft: result.livingArea ? Math.round(result.price / result.livingArea) : undefined,
    }
  }

  private mapPropertyDetail(detail: ZillowPropertyDetail): PropertyListing {
    return {
      id: detail.zpid,
      address: detail.address.streetAddress,
      city: detail.address.city,
      state: detail.address.state,
      zipCode: detail.address.zipcode,
      price: detail.price || detail.zestimate || 0,
      bedrooms: detail.bedrooms || 0,
      bathrooms: detail.bathrooms || 0,
      sqft: detail.livingArea || 0,
      yearBuilt: detail.yearBuilt,
      propertyType: this.mapHomeType(detail.homeType),
      imageUrl: detail.imgSrc,
      listingUrl: detail.hdpUrl ? `https://www.zillow.com${detail.hdpUrl}` : undefined,
      latitude: detail.latitude,
      longitude: detail.longitude,
      lotSize: detail.lotSize,
      daysOnMarket: detail.daysOnZillow,
      description: detail.description,
      pricePerSqft: detail.livingArea ? Math.round((detail.price || detail.zestimate || 0) / detail.livingArea) : undefined,
    }
  }

  private mapZestimate(address: string, data: ZillowZestimate): HomeValuation {
    const zestimate = data.zestimate || 0
    const variance = zestimate * 0.1 // Default 10% variance if not provided

    return {
      address,
      zestimate,
      rentZestimate: data.rentZestimate,
      valueRange: {
        low: data.lowValue || Math.round(zestimate - variance),
        high: data.highValue || Math.round(zestimate + variance),
      },
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      taxAssessment: data.taxAssessedValue,
      yearBuilt: data.yearBuilt,
      sqft: data.livingArea,
    }
  }
}
