/**
 * @fileoverview Real Estate Provider Types
 *
 * Abstract interfaces for real estate data providers.
 * Implementations can use Zillow, Realtor, Redfin, or mock data.
 *
 * @module providers/real-estate/types
 */

/**
 * Parameters for searching properties
 */
export interface PropertySearchParams {
  location: string           // City, State or ZIP code
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: PropertyType | string  // Can be PropertyType or raw string
  limit?: number
}

/**
 * Property types supported by the system
 */
export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'apartment'
  | 'land'

/**
 * A property listing from search results
 */
export interface PropertyListing {
  id: string                 // Provider-specific ID (e.g., zpid for Zillow)
  address: string
  city: string
  state: string
  zipCode: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  yearBuilt?: number
  propertyType: PropertyType
  imageUrl?: string
  listingUrl?: string
  latitude?: number
  longitude?: number
  daysOnMarket?: number
  pricePerSqft?: number
}

/**
 * Home valuation estimate
 */
export interface HomeValuation {
  address: string
  estimate: number
  rentEstimate?: number
  valueRange: {
    low: number
    high: number
  }
  lastUpdated: string
  confidence?: 'high' | 'medium' | 'low'
}

/**
 * Property details with additional information
 */
export interface PropertyDetails extends PropertyListing {
  description?: string
  lotSize?: number
  parking?: number
  features?: string[]
  taxAssessment?: number
  hoaFee?: number
  images?: string[]
  priceHistory?: PriceHistoryEntry[]
}

/**
 * Price history entry
 */
export interface PriceHistoryEntry {
  date: string
  price: number
  event: 'listed' | 'sold' | 'price_change' | 'pending'
}

/**
 * Abstract interface for real estate data providers
 */
export interface RealEstateProvider {
  /** Provider name for logging/display */
  readonly name: string

  /**
   * Search for properties matching criteria
   */
  searchProperties(params: PropertySearchParams): Promise<PropertyListing[]>

  /**
   * Get detailed information about a specific property
   */
  getPropertyDetails(propertyId: string): Promise<PropertyDetails | null>

  /**
   * Get home valuation estimate for an address
   */
  getHomeValuation(address: string): Promise<HomeValuation | null>

  /**
   * Check if provider is available (API key configured, etc.)
   */
  isAvailable(): Promise<boolean>
}
