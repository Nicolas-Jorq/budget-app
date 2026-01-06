/**
 * LLM Provider Interface
 *
 * Abstraction layer for Large Language Model APIs. Implementations can use
 * different providers (OpenAI, Anthropic, Ollama, etc.) without changing
 * the application code.
 *
 * Available Providers:
 * - openai: OpenAI API (https://platform.openai.com/api-keys)
 *   - Endpoint: https://api.openai.com/v1/chat/completions
 *   - Auth: Bearer token (OPENAI_API_KEY)
 *   - Default model: gpt-4o-mini
 *
 * - ollama: Ollama local LLM (https://ollama.ai)
 *   - Endpoint: http://localhost:11434/api/chat
 *   - Auth: None required
 *   - Default model: llama3.2 or mistral
 *
 * - mock: Mock provider for testing (no API key required)
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMCompletionParams {
  messages: LLMMessage[]
  temperature?: number    // 0-2, default: 0.7
  maxTokens?: number      // Max tokens in response
  model?: string          // Override default model
}

export interface LLMResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Market Insight Request
 * Structured request for real estate market analysis
 */
export interface MarketInsightRequest {
  location: string        // City, State or ZIP
  questionType: 'buy_timing' | 'market_trend' | 'neighborhood' | 'investment' | 'general'
  additionalContext?: string
  propertyType?: string
  priceRange?: {
    min: number
    max: number
  }
}

export interface MarketInsight {
  summary: string         // Brief summary (1-2 sentences)
  analysis: string        // Detailed analysis
  factors: string[]       // Key factors considered
  recommendation?: string // Action recommendation
  confidence: 'low' | 'medium' | 'high'
  disclaimer: string      // Required disclaimer about AI-generated content
}

/**
 * LLM Provider Interface
 *
 * All LLM providers must implement this interface.
 */
export interface LLMProvider {
  /** Provider name for logging/debugging */
  name: string

  /**
   * Generate a completion from the LLM
   * @param params Completion parameters including messages
   * @returns LLM response with content and metadata
   */
  complete(params: LLMCompletionParams): Promise<LLMResponse>

  /**
   * Generate market insight analysis
   * Uses structured prompts for consistent real estate advice
   * @param request Market insight request parameters
   * @returns Structured market insight response
   */
  getMarketInsight(request: MarketInsightRequest): Promise<MarketInsight>

  /**
   * Check if the provider is properly configured and available
   * @returns true if provider can make API calls
   */
  isAvailable(): Promise<boolean>
}

/**
 * Default system prompt for real estate market analysis
 */
export const REAL_ESTATE_SYSTEM_PROMPT = `You are a helpful real estate market analyst assistant. Your role is to provide insights about housing markets, property values, and buying/selling timing.

Guidelines:
- Provide balanced, factual analysis based on general market knowledge
- Always acknowledge limitations and that you don't have real-time data
- Never make specific price predictions or guarantees
- Encourage users to consult with local real estate professionals
- Focus on educational information about market factors
- Be helpful but realistic about market uncertainties

Always include a disclaimer that this is AI-generated analysis and should not be the sole basis for financial decisions.`
