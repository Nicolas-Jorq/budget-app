/**
 * OpenAI LLM Provider
 *
 * Uses OpenAI's Chat Completions API for AI-powered insights.
 *
 * API Documentation: https://platform.openai.com/docs/api-reference/chat
 *
 * Endpoint:
 * - POST https://api.openai.com/v1/chat/completions
 *
 * Required Environment Variables:
 * - OPENAI_API_KEY: Your OpenAI API key
 *
 * Optional Environment Variables:
 * - OPENAI_MODEL: Model to use (default: gpt-4o-mini)
 */

import {
  LLMProvider,
  LLMCompletionParams,
  LLMResponse,
  MarketInsightRequest,
  MarketInsight,
  REAL_ESTATE_SYSTEM_PROMPT,
} from './types.js'

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI'

  private baseUrl = 'https://api.openai.com/v1'
  private defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  private get apiKey(): string {
    return process.env.OPENAI_API_KEY || ''
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  async complete(params: LLMCompletionParams): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const messages: OpenAIChatMessage[] = params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: params.model || this.defaultModel,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    const data = await response.json() as OpenAIChatCompletionResponse

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
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
    if (!this.apiKey) {
      return false
    }

    try {
      // Make a minimal request to check if the API is working
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.headers,
      })
      return response.ok
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
    // This is a best-effort parsing - LLM responses can vary
    const lines = content.split('\n').filter((l) => l.trim())

    // Try to extract sections
    let summary = ''
    let analysis = ''
    const factors: string[] = []
    let recommendation = ''

    let currentSection = 'summary'

    for (const line of lines) {
      const lineLower = line.toLowerCase()

      // Detect section changes
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

      // Add content to appropriate section
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

    // If parsing failed, use the full response as analysis
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
