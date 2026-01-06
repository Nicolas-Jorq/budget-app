/**
 * @fileoverview Property Search Component
 *
 * This component provides a comprehensive property search interface for finding
 * real estate listings. It includes filters for location, price range, bedrooms,
 * bathrooms, and property type, with results displayed as property cards.
 *
 * @module components/house/PropertySearch
 */

import { useState } from 'react'
import api from '../../services/api'
import { PropertyListing, PropertyType, PROPERTY_TYPE_INFO } from '../../types'
import PropertyCard from './PropertyCard'

/**
 * Props for the PropertySearch component.
 *
 * @interface PropertySearchProps
 * @property {string} goalId - The house goal ID for saving properties to
 * @property {string} [initialLocation] - Pre-filled location value
 * @property {number} [initialBedrooms] - Pre-filled minimum bedrooms
 * @property {number} [initialBathrooms] - Pre-filled minimum bathrooms
 * @property {PropertyType} [initialPropertyType] - Pre-filled property type filter
 * @property {() => void} [onPropertySaved] - Callback when a property is successfully saved
 */
interface PropertySearchProps {
  goalId: string
  initialLocation?: string
  initialBedrooms?: number
  initialBathrooms?: number
  initialPropertyType?: PropertyType
  onPropertySaved?: () => void
}

/**
 * Available property types for the filter dropdown.
 */
const propertyTypes: PropertyType[] = ['single_family', 'condo', 'townhouse', 'multi_family']

/**
 * Renders a property search form with filters and results display.
 *
 * Features:
 * - Location search (city, state, or ZIP code)
 * - Price range filters (min/max)
 * - Bedroom and bathroom minimum selectors
 * - Property type filter with icons
 * - Loading state during search
 * - Error handling with user-friendly messages
 * - Search results displayed as PropertyCard components
 * - Save properties to the associated house goal
 * - Visual feedback when a property is saved
 *
 * @param {PropertySearchProps} props - Component props
 * @param {string} props.goalId - Goal ID for saving properties
 * @param {string} [props.initialLocation=''] - Initial location value
 * @param {number} [props.initialBedrooms] - Initial bedrooms filter
 * @param {number} [props.initialBathrooms] - Initial bathrooms filter
 * @param {PropertyType} [props.initialPropertyType] - Initial property type
 * @param {() => void} [props.onPropertySaved] - Save success callback
 * @returns {JSX.Element} A search form and results grid
 *
 * @example
 * <PropertySearch
 *   goalId="goal-123"
 *   initialLocation="Austin, TX"
 *   initialBedrooms={3}
 *   onPropertySaved={() => refreshSavedProperties()}
 * />
 */
export default function PropertySearch({
  goalId,
  initialLocation = '',
  initialBedrooms,
  initialBathrooms,
  initialPropertyType,
  onPropertySaved,
}: PropertySearchProps) {
  // Search filter states
  const [location, setLocation] = useState(initialLocation)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [bedrooms, setBedrooms] = useState(initialBedrooms?.toString() || '')
  const [bathrooms, setBathrooms] = useState(initialBathrooms?.toString() || '')
  const [propertyType, setPropertyType] = useState<PropertyType | ''>(initialPropertyType || '')

  // Search results and status states
  const [results, setResults] = useState<PropertyListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  /**
   * Handles form submission to search for properties.
   * Builds query parameters from filter values and fetches results.
   *
   * @param {React.FormEvent} [e] - Optional form event (for form submission)
   */
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()

    // Validate location is provided
    if (!location.trim()) {
      setError('Please enter a location')
      return
    }

    setIsLoading(true)
    setError('')
    setHasSearched(true)

    try {
      // Build query parameters from active filters
      const params = new URLSearchParams({ location })
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (bedrooms) params.set('bedrooms', bedrooms)
      if (bathrooms) params.set('bathrooms', bathrooms)
      if (propertyType) params.set('propertyType', propertyType)

      const response = await api.get(`/house/search?${params.toString()}`)
      setResults(response.data)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search properties. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Saves a property from search results to the user's house goal.
   * Updates local state to show saved status without re-fetching.
   *
   * @param {PropertyListing} property - The property to save
   */
  const handleSaveProperty = async (property: PropertyListing) => {
    try {
      await api.post(`/goals/${goalId}/properties`, {
        zpid: property.id,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        sqft: property.sqft,
        yearBuilt: property.yearBuilt,
        propertyType: property.propertyType,
        imageUrl: property.imageUrl,
        listingUrl: property.listingUrl,
      })

      // Notify parent component of successful save
      onPropertySaved?.()

      // Mark property as saved in local state for immediate visual feedback
      // Using type assertion since _saved is a temporary UI-only property
      setResults((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, _saved: true } as PropertyListing : p))
      )
    } catch (err) {
      console.error('Error saving property:', err)
      setError('Failed to save property')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Form Card */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🔍</span> Search Properties
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Location input - spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State or ZIP code"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Price range inputs */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bedrooms selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Beds
            </label>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>

          {/* Bathrooms selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Baths
            </label>
            <select
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          {/* Property type selector with icons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType | '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any</option>
              {propertyTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {PROPERTY_TYPE_INFO[pt].icon} {PROPERTY_TYPE_INFO[pt].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Search button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search Properties'}
        </button>
      </form>

      {/* Search Results Section */}
      {hasSearched && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {results.length > 0 ? `${results.length} Properties Found` : 'No Properties Found'}
          </h3>

          {/* Results grid */}
          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onSave={() => handleSaveProperty(property)}
                  isSaved={(property as any)._saved}
                />
              ))}
            </div>
          )}

          {/* Empty state message */}
          {results.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No properties found matching your criteria.</p>
              <p className="text-sm mt-2">Try adjusting your search filters or expanding your location.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
