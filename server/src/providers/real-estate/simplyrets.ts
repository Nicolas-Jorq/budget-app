/**
 * @fileoverview SimplyRETS Real Estate Provider
 *
 * Provider implementation using SimplyRETS API.
 * SimplyRETS offers a free demo mode with sample data.
 *
 * Demo credentials (no signup needed):
 * - Username: simplyrets
 * - Password: simplyrets
 *
 * @see https://docs.simplyrets.com/
 * @module providers/real-estate/simplyrets
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
 * SimplyRETS API response types
 */
interface SimplyRetsProperty {
  mlsId: number
  address: {
    streetNumber: string
    streetName: string
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
    yearBuilt: number
    type: string
    style: string
  }
  geo: {
    lat: number
    lng: number
  }
  photos: string[]
  listDate: string
  remarks: string
  mls: {
    daysOnMarket: number
  }
}

/**
 * Map SimplyRETS property type to our PropertyType
 */
function mapPropertyType(type: string): PropertyType {
  const typeMap: Record<string, PropertyType> = {
    'RES': 'single_family',
    'Residential': 'single_family',
    'Single Family': 'single_family',
    'CND': 'condo',
    'Condominium': 'condo',
    'Condo': 'condo',
    'TWN': 'townhouse',
    'Townhouse': 'townhouse',
    'MLT': 'multi_family',
    'Multi-Family': 'multi_family',
    'APT': 'apartment',
    'Apartment': 'apartment',
    'LND': 'land',
    'Land': 'land',
  }
  return typeMap[type] || 'single_family'
}

/**
 * SimplyRETS provider implementation
 */
export class SimplyRetsProvider implements RealEstateProvider {
  readonly name = 'SimplyRETS'
  private baseUrl = 'https://api.simplyrets.com'
  private username: string
  private password: string

  constructor() {
    // Use demo credentials if none provided
    this.username = process.env.SIMPLYRETS_API_KEY || 'simplyrets'
    this.password = process.env.SIMPLYRETS_API_SECRET || 'simplyrets'
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64')
    return `Basic ${credentials}`
  }

  async searchProperties(params: PropertySearchParams): Promise<PropertyListing[]> {
    const queryParams = new URLSearchParams()
    
    // SimplyRETS uses q for location search
    if (params.location) {
      queryParams.append('q', params.location)
    }
    if (params.minPrice) {
      queryParams.append('minprice', params.minPrice.toString())
    }
    if (params.maxPrice) {
      queryParams.append('maxprice', params.maxPrice.toString())
    }
    if (params.bedrooms) {
      queryParams.append('minbeds', params.bedrooms.toString())
    }
    if (params.bathrooms) {
      queryParams.append('minbaths', params.bathrooms.toString())
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString())
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/properties?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`SimplyRETS API error: ${response.status}`)
      }

      const data = await response.json() as SimplyRetsProperty[]

      return data.map(p => this.mapToPropertyListing(p))
    } catch (error) {
      console.error('SimplyRETS search error:', error)
      throw error
    }
  }

  async getPropertyDetails(propertyId: string): Promise<PropertyDetails | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/properties/${propertyId}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        }
      )

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`SimplyRETS API error: ${response.status}`)
      }

      const data = await response.json() as SimplyRetsProperty

      const listing = this.mapToPropertyListing(data)
      
      return {
        ...listing,
        description: data.remarks,
        images: data.photos,
        features: [],  // SimplyRETS doesn't provide features in basic response
      }
    } catch (error) {
      console.error('SimplyRETS property details error:', error)
      throw error
    }
  }

  async getHomeValuation(_address: string): Promise<HomeValuation | null> {
    // SimplyRETS doesn't provide home valuations
    // Return null to indicate this feature is not available
    console.warn('SimplyRETS does not support home valuations')
    return null
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/properties?limit=1`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        }
      )
      return response.ok
    } catch {
      return false
    }
  }

  private mapToPropertyListing(data: SimplyRetsProperty): PropertyListing {
    const bathrooms = data.property.bathsFull + (data.property.bathsHalf * 0.5)
    
    return {
      id: data.mlsId.toString(),
      address: data.address.full || `${data.address.streetNumber} ${data.address.streetName}`,
      city: data.address.city,
      state: data.address.state,
      zipCode: data.address.postalCode,
      price: data.listPrice,
      bedrooms: data.property.bedrooms,
      bathrooms,
      sqft: data.property.area,
      yearBuilt: data.property.yearBuilt,
      propertyType: mapPropertyType(data.property.type),
      imageUrl: data.photos?.[0],
      listingUrl: undefined,  // SimplyRETS doesn't provide listing URLs
      latitude: data.geo?.lat,
      longitude: data.geo?.lng,
      daysOnMarket: data.mls?.daysOnMarket,
      pricePerSqft: data.property.area ? Math.round(data.listPrice / data.property.area) : undefined,
    }
  }
}
