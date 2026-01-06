/**
 * Ollama LLM Provider
 *
 * Uses Ollama for local LLM inference. Free and private - no API key required.
 *
 * Setup:
 * 1. Install Ollama: https://ollama.ai
 * 2. Pull a model: ollama pull llama3.2
 * 3. Ollama runs automatically on install
 *
 * API Documentation: https://github.com/ollama/ollama/blob/main/docs/api.md
 *
 * Endpoint:
 * - POST http://localhost:11434/api/chat
 *
 * Optional Environment Variables:
 * - OLLAMA_BASE_URL: Base URL (default: http://localhost:11434)
 * - OLLAMA_MODEL: Model to use (default: llama3.2)
 */

import {
  LLMProvider,
  LLMCompletionParams,
  LLMResponse,
  MarketInsightRequest,
  MarketInsight,
  REAL_ESTATE_SYSTEM_PROMPT,
} from './types.js'

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

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

interface OllamaTagsResponse {
  models: {
    name: string
    modified_at: string
    size: number
  }[]
}

export class OllamaProvider implements LLMProvider {
  name = 'Ollama (Local)'

  private baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  private defaultModel = process.env.OLLAMA_MODEL || 'llama3.2'

  async complete(params: LLMCompletionParams): Promise<LLMResponse> {
    const messages: OllamaChatMessage[] = params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const model = params.model || this.defaultModel

    // Check if model is available
    const available = await this.isModelAvailable(model)
    if (!available) {
      throw new Error(
        `Ollama model '${model}' not found. Run 'ollama pull ${model}' to download it.`
      )
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: params.temperature ?? 0.7,
          num_predict: params.maxTokens,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API error: ${response.status} - ${error}`)
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
  }

  async getMarketInsight(request: MarketInsightRequest): Promise<MarketInsight> {
    const userPrompt = this.buildMarketInsightPrompt(request)

    const response = await this.complete({
      messages: [
        { role: 'system', content: REAL_ESTATE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 1000,
    })

    return this.parseMarketInsightResponse(response.content, request)
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      })
      return response.ok
    } catch {
      return false
    }
  }

  private async isModelAvailable(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return false

      const data = await response.json() as OllamaTagsResponse
      return data.models.some(
        (m) => m.name === model || m.name.startsWith(`${model}:`)
      )
    } catch {
      return false
    }
  }

  private buildMarketInsightPrompt(request: MarketInsightRequest): string {
    const questionPrompts: Record<string, string> = {
      buy_timing: `Is now a good time to buy a home in ${request.location}? Consider current market conditions, interest rates, and buyer/seller dynamics.`,
      market_trend: `What are the current real estate market trends in ${request.location}? Discuss price trends, inventory, and market direction.`,
      neighborhood: `What should I know about neighborhoods in ${request.location}? Consider safety, schools, amenities, and lifestyle factors.`,
      investment: `Is ${request.location} a good area for real estate investment? Analyze rental yields, appreciation potential, and investment considerations.`,
      general: `What should I know about buying a home in ${request.location}? Provide general guidance for homebuyers.`,
    }

    let prompt = questionPrompts[request.questionType] || questionPrompts.general

    if (request.additionalContext) {
      prompt += `\n\nAdditional context: ${request.additionalContext}`
    }

    if (request.propertyType) {
      prompt += `\n\nProperty type of interest: ${request.propertyType}`
    }

    if (request.priceRange) {
      prompt += `\n\nPrice range: $${request.priceRange.min.toLocaleString()} - $${request.priceRange.max.toLocaleString()}`
    }

    prompt += `

Please provide your response in the following format:
1. A brief 1-2 sentence summary
2. A detailed analysis with numbered points
3. List the key factors you considered
4. A specific recommendation
5. End with a disclaimer about AI-generated content`

    return prompt
  }

  private parseMarketInsightResponse(content: string, request: MarketInsightRequest): MarketInsight {
    // Parse the LLM response into structured format
    const lines = content.split('\n').filter((l) => l.trim())

    let summary = ''
    let analysis = ''
    const factors: string[] = []
    let recommendation = ''

    let currentSection = 'summary'

    for (const line of lines) {
      const lineLower = line.toLowerCase()

      if (lineLower.includes('summary') || lineLower.includes('brief')) {
        currentSection = 'summary'
        continue
      }
      if (lineLower.includes('analysis') || lineLower.includes('detail')) {
        currentSection = 'analysis'
        continue
      }
      if (lineLower.includes('factor') || lineLower.includes('consider')) {
        currentSection = 'factors'
        continue
      }
      if (lineLower.includes('recommend')) {
        currentSection = 'recommendation'
        continue
      }
      if (lineLower.includes('disclaimer')) {
        currentSection = 'disclaimer'
        continue
      }

      const cleanLine = line.replace(/^[\d\.\-\*]+\s*/, '').trim()
      if (!cleanLine) continue

      switch (currentSection) {
        case 'summary':
          if (!summary) summary = cleanLine
          break
        case 'analysis':
          analysis += (analysis ? '\n' : '') + line
          break
        case 'factors':
          if (cleanLine.length > 5) factors.push(cleanLine)
          break
        case 'recommendation':
          if (!recommendation) recommendation = cleanLine
          break
      }
    }

    if (!summary && !analysis) {
      const sentences = content.split(/[.!?]+/).filter((s) => s.trim())
      summary = sentences[0]?.trim() || 'Market analysis for ' + request.location
      analysis = content
    }

    return {
      summary: summary || `Market analysis for ${request.location}`,
      analysis: analysis || content,
      factors: factors.length > 0 ? factors : ['Market conditions', 'Interest rates', 'Local inventory', 'Economic factors'],
      recommendation,
      confidence: 'medium',
      disclaimer: 'This is AI-generated analysis based on general market knowledge. It should not be the sole basis for financial decisions. Consult with local real estate professionals and financial advisors for personalized advice.',
    }
  }
}
