/**
 * @fileoverview OpenAI LLM Provider
 *
 * Provider implementation using OpenAI's chat completions API.
 * Requires an OpenAI API key.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 * @module providers/llm/openai
 */

import type {
  LLMProvider,
  LLMCompletionParams,
  LLMCompletionResponse,
} from './types.js'

/**
 * OpenAI API response types
 */
interface OpenAIChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'OpenAI'
  readonly defaultModel = 'gpt-4o-mini'
  private baseUrl = 'https://api.openai.com/v1'
  private apiKey: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
  }

  async complete(params: LLMCompletionParams): Promise<LLMCompletionResponse> {
    const model = params.model || this.defaultModel

    const requestBody = {
      model,
      messages: params.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1000,
    }

    try {
      const response = await fetch(this.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = 'OpenAI API error: ' + response.status + ' - ' + JSON.stringify(errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json() as OpenAIChatResponse

      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      }
    } catch (error) {
      console.error('OpenAI completion error:', error)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    try {
      const response = await fetch(this.baseUrl + '/models', {
        headers: {
          'Authorization': 'Bearer ' + this.apiKey,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
