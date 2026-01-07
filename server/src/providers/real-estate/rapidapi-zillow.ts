/**
 * @fileoverview RapidAPI Zillow Real Estate Provider
 *
 * Provider implementation using Zillow data via RapidAPI.
 * Requires a RapidAPI key with subscription to zillow-com1.p.rapidapi.com
 *
 * @see https://rapidapi.com/apimaker/api/zillow-com1
 * @module providers/real-estate/rapidapi-zillow
 */

import type {
  RealEstateProvider,
  PropertySearchParams,
  PropertyListing,
  PropertyDetails,
  HomeValuation,
  PropertyType,
} from './types.js'

/**
 * RapidAPI Zillow response types
 */
interface ZillowSearchResult {
  zpid: string
  address: string
  city: string
  state: string
  zipcode: string
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
  description?: string
  lotSize?: number
  parkingSpaces?: number
  homeStatus?: string
  taxAssessment?: number
  photos?: string[]
  zestimate?: number
  rentZestimate?: number
  priceHistory?: Array<{
    date: string
    price: number
    event: string
  }>
}

interface ZillowZestimate {
  zestimate: number
  rentZestimate?: number
  valueLow: number
  valueHigh: number
  address: string
}

/**
 * Map Zillow home type to our PropertyType
 */
function mapPropertyType(homeType: string): PropertyType {
  const typeMap: Record<string, PropertyType> = {
    'SINGLE_FAMILY': 'single_family',
    'CONDO': 'condo',
    'TOWNHOUSE': 'townhouse',
    'MULTI_FAMILY': 'multi_family',
    'APARTMENT': 'apartment',
    'LOT': 'land',
    'MANUFACTURED': 'single_family',
  }
  return typeMap[homeType] || 'single_family'
}

/**
 * RapidAPI Zillow provider implementation
 */
export class RapidAPIZillowProvider implements RealEstateProvider {
  readonly name = 'Zillow (RapidAPI)'
  private baseUrl = 'https://zillow-com1.p.rapidapi.com'
  private apiKey: string
  private apiHost: string

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || ''
    this.apiHost = process.env.RAPIDAPI_HOST || 'zillow-com1.p.rapidapi.com'
  }

  private getHeaders(): Record<string, string> {
    return {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': this.apiHost,
    }
  }

  async searchProperties(params: PropertySearchParams): Promise<PropertyListing[]> {
    const queryParams = new URLSearchParams({
      location: params.location,
      status_type: 'ForSale',
    })

    if (params.minPrice) {
      queryParams.append('minPrice', params.minPrice.toString())
    }
    if (params.maxPrice) {
      queryParams.append('maxPrice', params.maxPrice.toString())
    }
    if (params.bedrooms) {
      queryParams.append('bedsMin', params.bedrooms.toString())
    }
    if (params.bathrooms) {
      queryParams.append('bathsMin', params.bathrooms.toString())
    }
    if (params.propertyType) {
      queryParams.append('home_type', params.propertyType.toUpperCase())
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/propertyExtendedSearch?${queryParams.toString()}`,
        { headers: this.getHeaders() }
      )

      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`)
      }

      const data = await response.json() as { props?: ZillowSearchResult[] }
      const properties: ZillowSearchResult[] = data.props || []

      let results = properties.map(p => this.mapToPropertyListing(p))

      // Apply limit
      if (params.limit && params.limit < results.length) {
        results = results.slice(0, params.limit)
      }

      return results
    } catch (error) {
      console.error('Zillow search error:', error)
      throw error
    }
  }

  async getPropertyDetails(propertyId: string): Promise<PropertyDetails | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/property?zpid=${propertyId}`,
        { headers: this.getHeaders() }
      )

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`)
      }

      const data = await response.json() as ZillowPropertyDetail

      return {
        id: data.zpid,
        address: data.address.streetAddress,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipcode,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.livingArea,
        yearBuilt: data.yearBuilt,
        propertyType: mapPropertyType(data.homeType),
        imageUrl: data.photos?.[0],
        description: data.description,
        lotSize: data.lotSize,
        parking: data.parkingSpaces,
        taxAssessment: data.taxAssessment,
        images: data.photos,
        priceHistory: data.priceHistory?.map(h => ({
          date: h.date,
          price: h.price,
          event: h.event.toLowerCase() as 'listed' | 'sold' | 'price_change' | 'pending',
        })),
        pricePerSqft: data.livingArea ? Math.round(data.price / data.livingArea) : undefined,
      }
    } catch (error) {
      console.error('Zillow property details error:', error)
      throw error
    }
  }

  async getHomeValuation(address: string): Promise<HomeValuation | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/zestimate?address=${encodeURIComponent(address)}`,
        { headers: this.getHeaders() }
      )

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`)
      }

      const data = await response.json() as ZillowZestimate

      return {
        address: data.address,
        estimate: data.zestimate,
        rentEstimate: data.rentZestimate,
        valueRange: {
          low: data.valueLow,
          high: data.valueHigh,
        },
        lastUpdated: new Date().toISOString(),
        confidence: 'medium',  // Zillow doesn't provide confidence
      }
    } catch (error) {
      console.error('Zillow valuation error:', error)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }
    
    try {
      // Make a minimal API call to verify credentials
      const response = await fetch(
        `${this.baseUrl}/propertyExtendedSearch?location=Austin,TX&status_type=ForSale`,
        { headers: this.getHeaders() }
      )
      return response.ok
    } catch {
      return false
    }
  }

  private mapToPropertyListing(data: ZillowSearchResult): PropertyListing {
    return {
      id: data.zpid,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipcode,
      price: data.price,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqft: data.livingArea,
      yearBuilt: data.yearBuilt,
      propertyType: mapPropertyType(data.homeType),
      imageUrl: data.imgSrc,
      listingUrl: data.detailUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      daysOnMarket: data.daysOnZillow,
      pricePerSqft: data.livingArea ? Math.round(data.price / data.livingArea) : undefined,
    }
  }
}
