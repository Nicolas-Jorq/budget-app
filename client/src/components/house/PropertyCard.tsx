import { PropertyListing, PropertySnapshot, PROPERTY_TYPE_INFO, PropertyType } from '../../types'

interface PropertyCardProps {
  property: PropertyListing | PropertySnapshot
  onSave?: () => void
  onRemove?: () => void
  onToggleFavorite?: () => void
  isSaved?: boolean
  showActions?: boolean
}

export default function PropertyCard({
  property,
  onSave,
  onRemove,
  onToggleFavorite,
  isSaved = false,
  showActions = true,
}: PropertyCardProps) {
  const isFavorite = 'isFavorite' in property ? property.isFavorite : false
  const listingUrl = 'listingUrl' in property ? property.listingUrl : null
  const daysOnMarket = 'daysOnMarket' in property ? property.daysOnMarket : null
  const pricePerSqft = 'pricePerSqft' in property ? property.pricePerSqft :
    (property.sqft && property.price ? Math.round(Number(property.price) / property.sqft) : null)

  const propertyTypeInfo = property.propertyType && PROPERTY_TYPE_INFO[property.propertyType as PropertyType]
    ? PROPERTY_TYPE_INFO[property.propertyType as PropertyType]
    : null

  const fullAddress = 'city' in property
    ? `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`
    : property.address

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
            {propertyTypeInfo?.icon || '🏠'}
          </div>
        )}

        {/* Favorite button */}
        {showActions && onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}

        {/* Days on market badge */}
        {daysOnMarket !== null && daysOnMarket !== undefined && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
            {daysOnMarket} days on market
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            ${Number(property.price).toLocaleString('en-US')}
          </div>
          {propertyTypeInfo && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {propertyTypeInfo.icon} {propertyTypeInfo.label}
            </span>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
          {fullAddress}
        </p>

        {/* Property specs */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          {property.bedrooms !== null && property.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {property.bedrooms} bed
            </span>
          )}
          {property.bathrooms !== null && property.bathrooms !== undefined && (
            <span>{property.bathrooms} bath</span>
          )}
          {property.sqft && (
            <span>{property.sqft.toLocaleString()} sqft</span>
          )}
        </div>

        {/* Additional info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-4">
          {pricePerSqft && (
            <span>${pricePerSqft}/sqft</span>
          )}
          {property.yearBuilt && (
            <span>Built {property.yearBuilt}</span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            {listingUrl && (
              <a
                href={listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 text-center text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View Listing
              </a>
            )}
            {!isSaved && onSave && (
              <button
                onClick={onSave}
                className="flex-1 py-2 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Property
              </button>
            )}
            {isSaved && onRemove && (
              <button
                onClick={onRemove}
                className="flex-1 py-2 px-3 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
