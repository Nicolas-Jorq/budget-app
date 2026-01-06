/**
 * Provider Registry
 *
 * Central configuration for all external service providers.
 * This file documents all available providers, their endpoints, and required environment variables.
 *
 * IMPORTANT: Never hardcode API keys. All secrets must come from environment variables.
 */

import { RealEstateProvider } from './real-estate/types.js'
import { LLMProvider } from './llm/types.js'

/**
 * Real Estate Provider Configuration
 *
 * Available providers and their setup requirements:
 */
export const REAL_ESTATE_PROVIDERS = {
  /**
   * RapidAPI Zillow Provider
   *
   * Setup:
   * 1. Create account at https://rapidapi.com
   * 2. Subscribe to "Zillow" API: https://rapidapi.com/apimaker/api/zillow-com1
   * 3. Copy your RapidAPI key from the dashboard
   * 4. Add to .env: RAPIDAPI_KEY=your_key_here
   *
   * Endpoints:
   * - Base URL: https://zillow-com1.p.rapidapi.com
   * - GET /propertyExtendedSearch - Search properties by location
   * - GET /property - Get property details by zpid
   * - GET /zestimate - Get home valuation by zpid
   *
   * Headers Required:
   * - X-RapidAPI-Key: ${RAPIDAPI_KEY}
   * - X-RapidAPI-Host: zillow-com1.p.rapidapi.com
   *
   * Rate Limits (Free Tier):
   * - 100 requests/month
   */
  rapidapi_zillow: {
    name: 'RapidAPI Zillow',
    envKeys: ['RAPIDAPI_KEY'],
    baseUrl: 'https://zillow-com1.p.rapidapi.com',
    host: 'zillow-com1.p.rapidapi.com',
    freeLimit: 100,
    endpoints: {
      search: '/propertyExtendedSearch',
      property: '/property',
      zestimate: '/zestimate',
    },
  },

  /**
   * Mock Provider (for testing)
   *
   * No setup required. Returns fake data.
   * Use this for development and testing.
   */
  mock: {
    name: 'Mock Provider',
    envKeys: [],
    baseUrl: null,
    freeLimit: Infinity,
  },
} as const

/**
 * LLM Provider Configuration
 *
 * Available providers and their setup requirements:
 */
export const LLM_PROVIDERS = {
  /**
   * OpenAI Provider
   *
   * Setup:
   * 1. Create account at https://platform.openai.com
   * 2. Generate API key: https://platform.openai.com/api-keys
   * 3. Add to .env: OPENAI_API_KEY=your_key_here
   *
   * Endpoint:
   * - Base URL: https://api.openai.com/v1
   * - POST /chat/completions
   *
   * Headers Required:
   * - Authorization: Bearer ${OPENAI_API_KEY}
   * - Content-Type: application/json
   *
   * Recommended Model: gpt-4o-mini (cost-effective)
   */
  openai: {
    name: 'OpenAI',
    envKeys: ['OPENAI_API_KEY'],
    baseUrl: 'https://api.openai.com/v1',
    endpoints: {
      chat: '/chat/completions',
    },
    defaultModel: 'gpt-4o-mini',
    pricing: '$0.15/1M input tokens, $0.60/1M output tokens',
  },

  /**
   * Ollama Provider (Local)
   *
   * Setup:
   * 1. Install Ollama: https://ollama.ai
   * 2. Pull a model: ollama pull llama3.2
   * 3. Start Ollama server (usually runs automatically)
   * 4. Optionally set in .env: OLLAMA_BASE_URL=http://localhost:11434
   *
   * Endpoint:
   * - Base URL: http://localhost:11434/api
   * - POST /chat
   *
   * No authentication required.
   *
   * Recommended Models:
   * - llama3.2 (8B params, general purpose)
   * - mistral (7B params, good for analysis)
   */
  ollama: {
    name: 'Ollama (Local)',
    envKeys: [],
    baseUrl: 'http://localhost:11434',
    endpoints: {
      chat: '/api/chat',
      tags: '/api/tags', // List available models
    },
    defaultModel: 'llama3.2',
    pricing: 'Free (runs locally)',
  },

  /**
   * Mock Provider (for testing)
   *
   * No setup required. Returns canned responses.
   * Use this for development and testing.
   */
  mock: {
    name: 'Mock Provider',
    envKeys: [],
    baseUrl: null,
  },
} as const

/**
 * Provider Types
 */
export type RealEstateProviderType = keyof typeof REAL_ESTATE_PROVIDERS
export type LLMProviderType = keyof typeof LLM_PROVIDERS

/**
 * Get the configured real estate provider type from environment
 */
export function getRealEstateProviderType(): RealEstateProviderType {
  const provider = process.env.REAL_ESTATE_PROVIDER || 'mock'
  if (provider in REAL_ESTATE_PROVIDERS) {
    return provider as RealEstateProviderType
  }
  console.warn(`Unknown real estate provider: ${provider}, falling back to mock`)
  return 'mock'
}

/**
 * Get the configured LLM provider type from environment
 */
export function getLLMProviderType(): LLMProviderType {
  const provider = process.env.LLM_PROVIDER || 'mock'
  if (provider in LLM_PROVIDERS) {
    return provider as LLMProviderType
  }
  console.warn(`Unknown LLM provider: ${provider}, falling back to mock`)
  return 'mock'
}

/**
 * Check if required environment variables are set for a provider
 */
export function checkProviderEnv(providerConfig: { envKeys: readonly string[] }): {
  valid: boolean
  missing: string[]
} {
  const missing = providerConfig.envKeys.filter((key) => !process.env[key])
  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Factory function to create real estate provider
 * Lazy-loaded to avoid circular dependencies
 */
export async function createRealEstateProvider(): Promise<RealEstateProvider> {
  const providerType = getRealEstateProviderType()

  switch (providerType) {
    case 'rapidapi_zillow': {
      const { RapidAPIZillowProvider } = await import('./real-estate/rapidapi-zillow.js')
      return new RapidAPIZillowProvider()
    }
    case 'mock':
    default: {
      const { MockRealEstateProvider } = await import('./real-estate/mock.js')
      return new MockRealEstateProvider()
    }
  }
}

/**
 * Factory function to create LLM provider
 * Lazy-loaded to avoid circular dependencies
 */
export async function createLLMProvider(): Promise<LLMProvider> {
  const providerType = getLLMProviderType()

  switch (providerType) {
    case 'openai': {
      const { OpenAIProvider } = await import('./llm/openai.js')
      return new OpenAIProvider()
    }
    case 'ollama': {
      const { OllamaProvider } = await import('./llm/ollama.js')
      return new OllamaProvider()
    }
    case 'mock':
    default: {
      const { MockLLMProvider } = await import('./llm/mock.js')
      return new MockLLMProvider()
    }
  }
}

/**
 * Get provider status for debugging/admin purposes
 */
export async function getProviderStatus(): Promise<{
  realEstate: {
    type: RealEstateProviderType
    name: string
    available: boolean
    missingEnv: string[]
  }
  llm: {
    type: LLMProviderType
    name: string
    available: boolean
    missingEnv: string[]
  }
}> {
  const realEstateType = getRealEstateProviderType()
  const llmType = getLLMProviderType()

  const realEstateConfig = REAL_ESTATE_PROVIDERS[realEstateType]
  const llmConfig = LLM_PROVIDERS[llmType]

  const realEstateEnvCheck = checkProviderEnv(realEstateConfig)
  const llmEnvCheck = checkProviderEnv(llmConfig)

  let realEstateAvailable = realEstateEnvCheck.valid
  let llmAvailable = llmEnvCheck.valid

  // For providers that don't require env vars, check actual availability
  if (realEstateEnvCheck.valid) {
    try {
      const provider = await createRealEstateProvider()
      realEstateAvailable = await provider.isAvailable()
    } catch {
      realEstateAvailable = false
    }
  }

  if (llmEnvCheck.valid) {
    try {
      const provider = await createLLMProvider()
      llmAvailable = await provider.isAvailable()
    } catch {
      llmAvailable = false
    }
  }

  return {
    realEstate: {
      type: realEstateType,
      name: realEstateConfig.name,
      available: realEstateAvailable,
      missingEnv: realEstateEnvCheck.missing,
    },
    llm: {
      type: llmType,
      name: llmConfig.name,
      available: llmAvailable,
      missingEnv: llmEnvCheck.missing,
    },
  }
}
