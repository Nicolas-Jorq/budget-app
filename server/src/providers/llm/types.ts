/**
 * @fileoverview LLM Provider Types
 *
 * Abstract interfaces for LLM/AI providers.
 * Implementations can use OpenAI, Anthropic, Ollama, or mock data.
 *
 * @module providers/llm/types
 */

/**
 * Message role in a conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant'

/**
 * A message in a conversation
 */
export interface LLMMessage {
  role: MessageRole
  content: string
}

/**
 * Parameters for LLM completion requests
 */
export interface LLMCompletionParams {
  messages: LLMMessage[]
  temperature?: number      // 0-1, lower = more deterministic
  maxTokens?: number        // Max tokens in response
  model?: string            // Override default model
}

/**
 * Response from an LLM completion
 */
export interface LLMCompletionResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Abstract interface for LLM providers
 */
export interface LLMProvider {
  /** Provider name for logging/display */
  readonly name: string

  /** Default model for this provider */
  readonly defaultModel: string

  /**
   * Generate a completion from messages
   */
  complete(params: LLMCompletionParams): Promise<LLMCompletionResponse>

  /**
   * Check if provider is available (API key configured, service running, etc.)
   */
  isAvailable(): Promise<boolean>
}

/**
 * Pre-built prompts for real estate insights
 */
export const REAL_ESTATE_PROMPTS = {
  /**
   * Market analysis for a location
   */
  marketAnalysis: (location: string, priceRange?: { min?: number; max?: number }) => ({
    system: `You are a knowledgeable real estate market analyst. Provide concise, data-driven insights about housing markets. Focus on practical advice for home buyers. Keep responses under 300 words.`,
    user: `Analyze the current real estate market in ${location}.${
      priceRange?.min || priceRange?.max
        ? ` Focus on homes in the ${priceRange.min ? `$${priceRange.min.toLocaleString()}` : '$0'} to ${priceRange.max ? `$${priceRange.max.toLocaleString()}` : 'any price'} range.`
        : ''
    } Include:
1. Current market conditions (buyer's vs seller's market)
2. Recent price trends
3. Key factors affecting this market
4. Brief outlook for the next 6-12 months`,
  }),

  /**
   * Property evaluation
   */
  propertyEvaluation: (property: {
    address: string
    price: number
    sqft: number
    bedrooms: number
    bathrooms: number
    yearBuilt?: number
  }) => ({
    system: `You are a real estate advisor helping first-time home buyers evaluate properties. Be balanced - mention both positives and concerns. Keep responses under 250 words.`,
    user: `Evaluate this property for a potential buyer:
- Address: ${property.address}
- Price: $${property.price.toLocaleString()}
- Size: ${property.sqft.toLocaleString()} sqft
- Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
- Price per sqft: $${Math.round(property.price / property.sqft)}
${property.yearBuilt ? `- Year Built: ${property.yearBuilt}` : ''}

What are the key things to consider about this property?`,
  }),

  /**
   * Neighborhood comparison
   */
  neighborhoodComparison: (neighborhoods: string[]) => ({
    system: `You are a local real estate expert helping home buyers compare neighborhoods. Provide balanced, practical comparisons. Keep responses under 300 words.`,
    user: `Compare these neighborhoods for someone looking to buy a home: ${neighborhoods.join(', ')}.

For each neighborhood, briefly describe:
1. Character and vibe
2. Pros for home buyers
3. Potential drawbacks
4. Who it's best suited for`,
  }),

  /**
   * Affordability advice
   */
  affordabilityAdvice: (params: {
    income: number
    savings: number
    targetPrice: number
    location: string
  }) => ({
    system: `You are a financial advisor specializing in home buying. Provide practical, conservative advice. Keep responses under 250 words.`,
    user: `A buyer wants to purchase a home in ${params.location}.
- Annual household income: $${params.income.toLocaleString()}
- Current savings for down payment: $${params.savings.toLocaleString()}
- Target home price: $${params.targetPrice.toLocaleString()}

Is this purchase realistic? What do they need to consider?`,
  }),
}
