/**
 * @fileoverview Ollama LLM Provider
 *
 * Provider implementation using local Ollama server.
 * No API key needed - runs locally.
 *
 * @see https://ollama.ai/
 * @module providers/llm/ollama
 */

import type {
  LLMProvider,
  LLMCompletionParams,
  LLMCompletionResponse,
} from './types.js'

/**
 * Ollama API response types
 */
interface OllamaChatResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  prompt_eval_count?: number
  eval_count?: number
}

/**
 * Ollama provider implementation
 */
export class OllamaProvider implements LLMProvider {
  readonly name = 'Ollama (Local)'
  readonly defaultModel: string
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3.2'
  }

  async complete(params: LLMCompletionParams): Promise<LLMCompletionResponse> {
    const model = params.model || this.defaultModel

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: params.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          stream: false,
          options: {
            temperature: params.temperature ?? 0.7,
            num_predict: params.maxTokens ?? 1000,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json() as OllamaChatResponse

      return {
        content: data.message?.content || '',
        model: data.model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      }
    } catch (error) {
      console.error('Ollama completion error:', error)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) {
        return false
      }

      // Check if the default model is available
      const data = await response.json() as { models?: Array<{ name: string }> }
      const models = data.models || []
      return models.some((m) => m.name.startsWith(this.defaultModel))
    } catch {
      return false
    }
  }
}
