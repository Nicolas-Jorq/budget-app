/**
 * Real Estate Provider Interface
 *
 * Abstraction layer for real estate data APIs. Implementations can use
 * different providers (RapidAPI/Zillow, Realtor, Redfin, etc.) without
 * changing the application code.
 *
 * Available Providers:
 * - rapidapi_zillow: RapidAPI Zillow API (https://rapidapi.com/apimaker/api/zillow-com1)
 * - mock: Mock provider for testing (no API key required)
 */

export interface PropertySearchParams {
  location: string        // City, State or ZIP code
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: PropertyType
  limit?: number          // Max results to return (default: 20)
}

export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'apartment'
  | 'land'
  | 'other'

export interface PropertyListing {
  id: string              // Provider-specific property ID
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
  lotSize?: number        // Square feet
  description?: string
  daysOnMarket?: number
  pricePerSqft?: number
}

export interface HomeValuation {
  address: string
  zestimate: number       // Estimated value
  rentZestimate?: number  // Estimated monthly rent
  valueRange: {
    low: number
    high: number
  }
  lastUpdated: string     // ISO date string
  taxAssessment?: number
  yearBuilt?: number
  sqft?: number
}

export interface MortgageCalculation {
  homePrice: number
  downPayment: number
  downPaymentPercent: number
  loanAmount: number
  interestRate: number
  loanTermYears: number
  monthlyPayment: number
  monthlyBreakdown: {
    principal: number
    interest: number
    propertyTax: number
    homeInsurance: number
    pmi?: number          // Private Mortgage Insurance (if down payment < 20%)
  }
  totalPayment: number    // Total paid over loan term
  totalInterest: number   // Total interest paid
}

export interface MortgageParams {
  homePrice: number
  downPaymentPercent: number
  interestRate: number
  loanTermYears: number
  propertyTaxRate?: number    // Annual rate as decimal (default: 0.0125 = 1.25%)
  homeInsuranceRate?: number  // Annual rate as decimal (default: 0.0035 = 0.35%)
  pmiRate?: number            // Annual rate as decimal (default: 0.005 = 0.5%)
}

/**
 * Real Estate Provider Interface
 *
 * All real estate data providers must implement this interface.
 */
export interface RealEstateProvider {
  /** Provider name for logging/debugging */
  name: string

  /**
   * Search for properties matching the given criteria
   * @param params Search parameters
   * @returns Array of matching property listings
   */
  searchProperties(params: PropertySearchParams): Promise<PropertyListing[]>

  /**
   * Get detailed information about a specific property
   * @param propertyId Provider-specific property ID
   * @returns Property details or null if not found
   */
  getPropertyDetails(propertyId: string): Promise<PropertyListing | null>

  /**
   * Get home valuation estimate for an address
   * @param address Full address string
   * @returns Valuation data or null if not found
   */
  getHomeValuation(address: string): Promise<HomeValuation | null>

  /**
   * Calculate mortgage payments
   * @param params Mortgage calculation parameters
   * @returns Detailed mortgage breakdown
   */
  calculateMortgage(params: MortgageParams): MortgageCalculation

  /**
   * Check if the provider is properly configured and available
   * @returns true if provider can make API calls
   */
  isAvailable(): Promise<boolean>
}
