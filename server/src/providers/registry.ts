/**
 * @fileoverview Provider Registry & Factory
 *
 * Centralized configuration for all external service providers.
 * Factory functions to create provider instances based on environment.
 *
 * @module providers/registry
 */

import type { RealEstateProvider } from './real-estate/types.js'
import type { LLMProvider } from './llm/types.js'

/**
 * Provider configuration metadata
 */
export interface ProviderConfig {
  name: string
  envKeys: readonly string[]
  baseUrl?: string
  defaultModel?: string
  rateLimit?: {
    requests: number
    period: 'minute' | 'hour' | 'day' | 'month'
  }
}

/**
 * Registry of all available providers and their configuration
 */
export const PROVIDER_REGISTRY = {
  realEstate: {
    rapidapi_zillow: {
      name: 'RapidAPI Zillow',
      envKeys: ['RAPIDAPI_KEY'],
      baseUrl: 'https://zillow-com1.p.rapidapi.com',
      rateLimit: { requests: 100, period: 'month' as const },
    },
    simplyrets: {
      name: 'SimplyRETS',
      envKeys: ['SIMPLYRETS_API_KEY', 'SIMPLYRETS_API_SECRET'],
      baseUrl: 'https://api.simplyrets.com',
      rateLimit: { requests: 1000, period: 'day' as const },
    },
    mock: {
      name: 'Mock Provider',
      envKeys: [],
      baseUrl: undefined,
      rateLimit: undefined,
    },
  },
  llm: {
    openai: {
      name: 'OpenAI',
      envKeys: ['OPENAI_API_KEY'],
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
    },
    anthropic: {
      name: 'Anthropic',
      envKeys: ['ANTHROPIC_API_KEY'],
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-haiku-20240307',
    },
    ollama: {
      name: 'Ollama (Local)',
      envKeys: [],
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: process.env.OLLAMA_MODEL || 'llama3.2',
    },
    mock: {
      name: 'Mock Provider',
      envKeys: [],
      baseUrl: undefined,
      defaultModel: 'mock-model',
    },
  },
} as const

/**
 * Get the configured real estate provider type from environment
 */
export function getRealEstateProviderType(): keyof typeof PROVIDER_REGISTRY.realEstate {
  const provider = process.env.REAL_ESTATE_PROVIDER || 'mock'
  if (provider in PROVIDER_REGISTRY.realEstate) {
    return provider as keyof typeof PROVIDER_REGISTRY.realEstate
  }
  console.warn(`Unknown real estate provider: ${provider}, falling back to mock`)
  return 'mock'
}

/**
 * Get the configured LLM provider type from environment
 */
export function getLLMProviderType(): keyof typeof PROVIDER_REGISTRY.llm {
  const provider = process.env.LLM_PROVIDER || 'mock'
  if (provider in PROVIDER_REGISTRY.llm) {
    return provider as keyof typeof PROVIDER_REGISTRY.llm
  }
  console.warn(`Unknown LLM provider: ${provider}, falling back to mock`)
  return 'mock'
}

/**
 * Check if required environment variables are set for a provider
 */
export function checkProviderEnv(config: ProviderConfig): { valid: boolean; missing: string[] } {
  const missing = config.envKeys.filter(key => !process.env[key])
  return {
    valid: missing.length === 0,
    missing,
  }
}

// Lazy-loaded provider instances (singleton pattern)
let realEstateProviderInstance: RealEstateProvider | null = null
let llmProviderInstance: LLMProvider | null = null

/**
 * Create or get the real estate provider instance
 */
export async function createRealEstateProvider(): Promise<RealEstateProvider> {
  if (realEstateProviderInstance) {
    return realEstateProviderInstance
  }

  const providerType = getRealEstateProviderType()
  const config = PROVIDER_REGISTRY.realEstate[providerType]

  // Check environment variables
  const envCheck = checkProviderEnv(config)
  if (!envCheck.valid && providerType !== 'mock') {
    console.warn(
      `Missing env vars for ${config.name}: ${envCheck.missing.join(', ')}. Falling back to mock provider.`
    )
    const { MockRealEstateProvider } = await import('./real-estate/mock.js')
    realEstateProviderInstance = new MockRealEstateProvider()
    return realEstateProviderInstance
  }

  // Import and instantiate the appropriate provider
  switch (providerType) {
    case 'rapidapi_zillow': {
      const { RapidAPIZillowProvider } = await import('./real-estate/rapidapi-zillow.js')
      realEstateProviderInstance = new RapidAPIZillowProvider()
      break
    }
    case 'simplyrets': {
      const { SimplyRetsProvider } = await import('./real-estate/simplyrets.js')
      realEstateProviderInstance = new SimplyRetsProvider()
      break
    }
    case 'mock':
    default: {
      const { MockRealEstateProvider } = await import('./real-estate/mock.js')
      realEstateProviderInstance = new MockRealEstateProvider()
      break
    }
  }

  console.log(`Real estate provider initialized: ${realEstateProviderInstance!.name}`)
  return realEstateProviderInstance!
}

/**
 * Create or get the LLM provider instance
 */
export async function createLLMProvider(): Promise<LLMProvider> {
  if (llmProviderInstance) {
    return llmProviderInstance
  }

  const providerType = getLLMProviderType()
  const config = PROVIDER_REGISTRY.llm[providerType]

  // Check environment variables
  const envCheck = checkProviderEnv(config)
  if (!envCheck.valid && providerType !== 'mock' && providerType !== 'ollama') {
    console.warn(
      `Missing env vars for ${config.name}: ${envCheck.missing.join(', ')}. Falling back to mock provider.`
    )
    const { MockLLMProvider } = await import('./llm/mock.js')
    llmProviderInstance = new MockLLMProvider()
    return llmProviderInstance
  }

  // Import and instantiate the appropriate provider
  switch (providerType) {
    case 'openai': {
      const { OpenAIProvider } = await import('./llm/openai.js')
      llmProviderInstance = new OpenAIProvider()
      break
    }
    case 'anthropic': {
      const { AnthropicProvider } = await import('./llm/anthropic.js')
      llmProviderInstance = new AnthropicProvider()
      break
    }
    case 'ollama': {
      const { OllamaProvider } = await import('./llm/ollama.js')
      llmProviderInstance = new OllamaProvider()
      break
    }
    case 'mock':
    default: {
      const { MockLLMProvider } = await import('./llm/mock.js')
      llmProviderInstance = new MockLLMProvider()
      break
    }
  }

  console.log(`LLM provider initialized: ${llmProviderInstance!.name}`)
  return llmProviderInstance!
}

/**
 * Reset provider instances (useful for testing)
 */
export function resetProviders(): void {
  realEstateProviderInstance = null
  llmProviderInstance = null
}

/**
 * Get status of all configured providers
 */
export async function getProvidersStatus(): Promise<{
  realEstate: { provider: string; available: boolean; config: ProviderConfig }
  llm: { provider: string; available: boolean; config: ProviderConfig }
}> {
  const realEstateType = getRealEstateProviderType()
  const llmType = getLLMProviderType()

  const realEstateProvider = await createRealEstateProvider()
  const llmProvider = await createLLMProvider()

  return {
    realEstate: {
      provider: realEstateType,
      available: await realEstateProvider.isAvailable(),
      config: PROVIDER_REGISTRY.realEstate[realEstateType],
    },
    llm: {
      provider: llmType,
      available: await llmProvider.isAvailable(),
      config: PROVIDER_REGISTRY.llm[llmType],
    },
  }
}
