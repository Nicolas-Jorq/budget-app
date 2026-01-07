/**
 * @fileoverview Mock Real Estate Provider
 *
 * Provides fake real estate data for testing without API keys.
 * Returns realistic-looking data based on search parameters.
 *
 * @module providers/real-estate/mock
 */

import type {
  RealEstateProvider,
  PropertySearchParams,
  PropertyListing,
  PropertyDetails,
  HomeValuation,
} from './types.js'

/**
 * Sample property data for mock responses
 */
const MOCK_PROPERTIES: PropertyListing[] = [
  {
    id: 'mock-1',
    address: '123 Oak Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    price: 450000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1850,
    yearBuilt: 2015,
    propertyType: 'single_family',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    listingUrl: 'https://example.com/property/mock-1',
    latitude: 30.2672,
    longitude: -97.7431,
    daysOnMarket: 14,
    pricePerSqft: 243,
  },
  {
    id: 'mock-2',
    address: '456 Maple Avenue',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    price: 525000,
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2200,
    yearBuilt: 2018,
    propertyType: 'single_family',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    listingUrl: 'https://example.com/property/mock-2',
    latitude: 30.2622,
    longitude: -97.7241,
    daysOnMarket: 7,
    pricePerSqft: 239,
  },
  {
    id: 'mock-3',
    address: '789 Downtown Lofts #405',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    price: 375000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    yearBuilt: 2020,
    propertyType: 'condo',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    listingUrl: 'https://example.com/property/mock-3',
    latitude: 30.2700,
    longitude: -97.7400,
    daysOnMarket: 21,
    pricePerSqft: 313,
  },
  {
    id: 'mock-4',
    address: '321 Elm Court',
    city: 'Round Rock',
    state: 'TX',
    zipCode: '78664',
    price: 385000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1650,
    yearBuilt: 2012,
    propertyType: 'townhouse',
    imageUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
    listingUrl: 'https://example.com/property/mock-4',
    latitude: 30.5083,
    longitude: -97.6789,
    daysOnMarket: 30,
    pricePerSqft: 233,
  },
  {
    id: 'mock-5',
    address: '555 Luxury Lane',
    city: 'Austin',
    state: 'TX',
    zipCode: '78703',
    price: 850000,
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3500,
    yearBuilt: 2021,
    propertyType: 'single_family',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    listingUrl: 'https://example.com/property/mock-5',
    latitude: 30.2950,
    longitude: -97.7650,
    daysOnMarket: 3,
    pricePerSqft: 243,
  },
]

/**
 * Generate a random variation of a number
 */
function randomVariation(base: number, percentage: number): number {
  const variation = base * (percentage / 100)
  return Math.round(base + (Math.random() * variation * 2 - variation))
}

/**
 * Mock implementation of RealEstateProvider
 */
export class MockRealEstateProvider implements RealEstateProvider {
  readonly name = 'Mock Provider'

  async searchProperties(params: PropertySearchParams): Promise<PropertyListing[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))

    let results = [...MOCK_PROPERTIES]

    // Filter by price range
    if (params.minPrice) {
      results = results.filter(p => p.price >= params.minPrice!)
    }
    if (params.maxPrice) {
      results = results.filter(p => p.price <= params.maxPrice!)
    }

    // Filter by bedrooms
    if (params.bedrooms) {
      results = results.filter(p => p.bedrooms >= params.bedrooms!)
    }

    // Filter by bathrooms
    if (params.bathrooms) {
      results = results.filter(p => p.bathrooms >= params.bathrooms!)
    }

    // Filter by property type
    if (params.propertyType) {
      results = results.filter(p => p.propertyType === params.propertyType)
    }

    // Apply limit
    if (params.limit && params.limit < results.length) {
      results = results.slice(0, params.limit)
    }

    // Add some variation to make it feel more realistic
    return results.map(p => ({
      ...p,
      price: randomVariation(p.price, 5),
      daysOnMarket: Math.max(1, randomVariation(p.daysOnMarket || 14, 30)),
    }))
  }

  async getPropertyDetails(propertyId: string): Promise<PropertyDetails | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 150))

    const property = MOCK_PROPERTIES.find(p => p.id === propertyId)
    if (!property) {
      return null
    }

    // Add detailed information
    const details: PropertyDetails = {
      ...property,
      description: `Beautiful ${property.bedrooms} bedroom, ${property.bathrooms} bathroom ${property.propertyType.replace('_', ' ')} in ${property.city}. This stunning property features modern amenities, updated appliances, and a great location near shopping, dining, and entertainment.`,
      lotSize: property.propertyType === 'condo' ? undefined : randomVariation(8000, 20),
      parking: property.propertyType === 'condo' ? 1 : 2,
      features: [
        'Central AC',
        'Updated Kitchen',
        'Hardwood Floors',
        'Washer/Dryer',
        property.propertyType === 'single_family' ? 'Backyard' : 'Balcony',
        'Pet Friendly',
      ],
      taxAssessment: Math.round(property.price * 0.85),
      hoaFee: property.propertyType === 'condo' ? 350 : property.propertyType === 'townhouse' ? 150 : undefined,
      images: [
        property.imageUrl!,
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      ],
      priceHistory: [
        { date: '2024-01-15', price: property.price, event: 'listed' },
        { date: '2024-02-01', price: Math.round(property.price * 0.97), event: 'price_change' },
      ],
    }

    return details
  }

  async getHomeValuation(address: string): Promise<HomeValuation | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200))

    // Generate a mock valuation based on address
    const basePrice = 400000 + Math.random() * 300000
    const estimate = Math.round(basePrice)

    return {
      address,
      estimate,
      rentEstimate: Math.round(estimate * 0.004), // ~0.4% of value per month
      valueRange: {
        low: Math.round(estimate * 0.92),
        high: Math.round(estimate * 1.08),
      },
      lastUpdated: new Date().toISOString(),
      confidence: Math.random() > 0.3 ? 'high' : 'medium',
    }
  }

  async isAvailable(): Promise<boolean> {
    // Mock provider is always available
    return true
  }
}
