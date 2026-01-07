/**
 * @fileoverview Mock LLM Provider
 *
 * Provides fake AI responses for testing without API keys.
 * Returns realistic-looking responses for real estate queries.
 *
 * @module providers/llm/mock
 */

import type {
  LLMProvider,
  LLMCompletionParams,
  LLMCompletionResponse,
} from './types.js'

/**
 * Pre-canned responses for common real estate topics
 */
const MOCK_RESPONSES: Record<string, string> = {
  market: `Based on current market data, this area shows moderate activity with balanced supply and demand. Home prices have remained relatively stable over the past quarter, with a slight upward trend of 2-3%.

Key observations:
1. **Market Type**: Currently a balanced market, slightly favoring sellers
2. **Price Trends**: Median prices up 2.5% year-over-year
3. **Inventory**: Average days on market is around 25-30 days
4. **Outlook**: Expect continued stability with modest appreciation

For buyers, this is a reasonable time to purchase, though competition remains for well-priced properties.`,

  property: `This property appears to be fairly priced for the area. Here are the key considerations:

**Positives:**
- Price per square foot is in line with comparable properties
- Modern construction/recent updates reduce maintenance concerns
- Location provides good access to amenities

**Considerations:**
- Verify the condition of major systems (HVAC, roof, plumbing)
- Research HOA fees and rules if applicable
- Consider future resale potential

**Recommendation:** Worth pursuing if it meets your needs, but get a thorough inspection.`,

  neighborhood: `Here's a comparison of these neighborhoods:

**Overall Ranking by Home Buyer Priorities:**

Each area offers distinct advantages. Consider what matters most to you:
- **Commute**: Compare drive times to your workplace
- **Schools**: Research district ratings if applicable
- **Lifestyle**: Urban walkability vs suburban space
- **Budget**: Price differences can be significant

I recommend visiting each neighborhood at different times to get a feel for the community.`,

  affordability: `Based on the numbers provided, here's my assessment:

**Affordability Analysis:**
- The target price appears within reach, assuming standard lending criteria
- Aim for a debt-to-income ratio below 36% for comfortable payments
- Factor in property taxes, insurance, and potential HOA fees

**Recommendations:**
1. Get pre-approved to confirm your budget
2. Maintain emergency savings beyond the down payment
3. Consider all homeownership costs, not just the mortgage

A financial advisor or mortgage professional can provide personalized guidance.`,
}

/**
 * Mock implementation of LLMProvider
 */
export class MockLLMProvider implements LLMProvider {
  readonly name = 'Mock Provider'
  readonly defaultModel = 'mock-model'

  async complete(params: LLMCompletionParams): Promise<LLMCompletionResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))

    // Determine response type based on user message content
    const userMessage = params.messages.find(m => m.role === 'user')?.content.toLowerCase() || ''
    
    let response: string

    if (userMessage.includes('market') || userMessage.includes('analyze')) {
      response = MOCK_RESPONSES.market
    } else if (userMessage.includes('property') || userMessage.includes('evaluate')) {
      response = MOCK_RESPONSES.property
    } else if (userMessage.includes('neighborhood') || userMessage.includes('compare')) {
      response = MOCK_RESPONSES.neighborhood
    } else if (userMessage.includes('afford') || userMessage.includes('income') || userMessage.includes('budget')) {
      response = MOCK_RESPONSES.affordability
    } else {
      response = `I understand you're asking about real estate. Here are some general thoughts:

This is a mock response since no AI provider is configured. To get real AI-powered insights:

1. Set up an OpenAI API key (recommended for best results)
2. Or install Ollama for free local AI processing
3. Update your .env file with the appropriate provider settings

The mock provider demonstrates the feature flow without requiring API access.`
    }

    // Estimate token usage (rough approximation)
    const promptTokens = params.messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0)
    const completionTokens = Math.ceil(response.length / 4)

    return {
      content: response,
      model: this.defaultModel,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    }
  }

  async isAvailable(): Promise<boolean> {
    // Mock provider is always available
    return true
  }
}
