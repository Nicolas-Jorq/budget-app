/**
 * @fileoverview Anthropic LLM Provider
 *
 * Provider implementation using Anthropic's messages API.
 * Requires an Anthropic API key.
 *
 * @see https://docs.anthropic.com/en/api/messages
 * @module providers/llm/anthropic
 */

import type {
  LLMProvider,
  LLMCompletionParams,
  LLMCompletionResponse,
} from './types.js'

/**
 * Anthropic API response types
 */
interface AnthropicMessageResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: string
    text: string
  }>
  model: string
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'Anthropic'
  readonly defaultModel = 'claude-3-haiku-20240307'
  private baseUrl = 'https://api.anthropic.com/v1'
  private apiKey: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || ''
  }

  async complete(params: LLMCompletionParams): Promise<LLMCompletionResponse> {
    const model = params.model || this.defaultModel

    // Extract system message if present
    const systemMessage = params.messages.find(m => m.role === 'system')
    const nonSystemMessages = params.messages.filter(m => m.role !== 'system')

    const requestBody = {
      model,
      max_tokens: params.maxTokens ?? 1000,
      system: systemMessage?.content,
      messages: nonSystemMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }

    try {
      const response = await fetch(this.baseUrl + '/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = 'Anthropic API error: ' + response.status + ' - ' + JSON.stringify(errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json() as AnthropicMessageResponse

      return {
        content: data.content[0]?.text || '',
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
      }
    } catch (error) {
      console.error('Anthropic completion error:', error)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    // Anthropic doesn't have a simple health check endpoint
    // Just verify the API key format
    return this.apiKey.startsWith('sk-ant-')
  }
}
