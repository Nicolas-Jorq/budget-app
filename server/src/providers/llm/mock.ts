/**
 * Mock LLM Provider
 *
 * Returns canned responses for testing and development.
 * No API key required.
 */

import {
  LLMProvider,
  LLMCompletionParams,
  LLMResponse,
  MarketInsightRequest,
  MarketInsight,
} from './types.js'

const MOCK_MARKET_INSIGHTS: Record<string, MarketInsight> = {
  buy_timing: {
    summary: "Based on general market trends, now could be a reasonable time to buy if you're financially prepared.",
    analysis: `The housing market varies significantly by location, but here are some general factors to consider:

1. **Interest Rates**: Current mortgage rates affect affordability. When rates are historically low, it can offset higher home prices.

2. **Local Market Conditions**: Some markets are experiencing cooling while others remain competitive. Research your specific area.

3. **Personal Readiness**: The best time to buy is often when you're personally and financially ready, regardless of market timing.

4. **Inventory Levels**: More inventory typically means more options and potentially less competition.`,
    factors: [
      'Current mortgage interest rates',
      'Local housing inventory levels',
      'Your personal financial readiness',
      'Job stability and income prospects',
      'Long-term housing plans (5+ years)',
    ],
    recommendation: 'Focus on your personal financial situation and housing needs rather than trying to time the market perfectly.',
    confidence: 'medium',
    disclaimer: 'This is AI-generated analysis based on general market knowledge. Consult with local real estate professionals and financial advisors for personalized advice.',
  },
  market_trend: {
    summary: 'Housing markets show regional variation with some areas cooling while others remain stable.',
    analysis: `Market trends vary significantly by location. Here's what we're generally seeing:

1. **Price Trends**: After significant appreciation in recent years, many markets are showing more moderate price growth.

2. **Days on Market**: Properties are staying on market longer in many areas, giving buyers more time to make decisions.

3. **Buyer Competition**: Bidding wars have decreased in many markets, though desirable properties still attract multiple offers.

4. **New Construction**: Builders are responding to demand with new inventory in many areas.`,
    factors: [
      'Regional economic conditions',
      'Employment trends',
      'Population migration patterns',
      'New construction activity',
      'Seasonal market fluctuations',
    ],
    recommendation: 'Research your specific neighborhood and price range. Local conditions may differ from national trends.',
    confidence: 'medium',
    disclaimer: 'This is AI-generated analysis based on general market knowledge. Market conditions change frequently. Verify current data with local sources.',
  },
  neighborhood: {
    summary: 'Neighborhood quality depends on schools, safety, amenities, and future development plans.',
    analysis: `When evaluating neighborhoods, consider these factors:

1. **Schools**: Even if you don't have children, school quality affects property values.

2. **Safety**: Research crime statistics and talk to potential neighbors.

3. **Amenities**: Consider proximity to shopping, parks, restaurants, and entertainment.

4. **Commute**: Factor in your daily commute to work or school.

5. **Future Development**: Check local planning departments for upcoming projects that could affect the area.`,
    factors: [
      'School district ratings',
      'Crime statistics',
      'Proximity to amenities',
      'Commute times',
      'Future development plans',
      'HOA restrictions (if applicable)',
    ],
    recommendation: 'Visit the neighborhood at different times of day and week. Talk to residents about their experience.',
    confidence: 'high',
    disclaimer: 'This is AI-generated analysis. Verify neighborhood information through local sources and personal visits.',
  },
  investment: {
    summary: 'Real estate can be a solid long-term investment but requires careful analysis of rental potential and appreciation.',
    analysis: `Investment property considerations:

1. **Cash Flow**: Calculate expected rental income minus all expenses (mortgage, taxes, insurance, maintenance, vacancies).

2. **Appreciation**: Research historical price trends in the area.

3. **Cap Rate**: Compare the capitalization rate to other investment options.

4. **Management**: Factor in time and cost of property management.

5. **Tax Benefits**: Understand depreciation, deductions, and tax implications.`,
    factors: [
      'Expected rental yield',
      'Historical appreciation rates',
      'Property management costs',
      'Vacancy rates in the area',
      'Tax implications',
      'Financing costs',
    ],
    recommendation: 'Run detailed numbers before purchasing. A property that looks good on paper may have hidden costs.',
    confidence: 'medium',
    disclaimer: 'This is AI-generated analysis. Consult with a CPA and real estate investment advisor before making investment decisions.',
  },
  general: {
    summary: 'Home buying is a significant decision that requires balancing financial, practical, and personal factors.',
    analysis: `Key considerations for home buyers:

1. **Affordability**: Most experts recommend spending no more than 28-30% of gross income on housing.

2. **Down Payment**: While 20% is traditional, many programs allow lower down payments.

3. **Total Costs**: Remember to budget for closing costs, moving, and immediate repairs.

4. **Pre-Approval**: Get pre-approved for a mortgage to understand your budget.

5. **Long-term Plans**: Consider how long you plan to stay and how the home fits your future needs.`,
    factors: [
      'Monthly budget and affordability',
      'Down payment savings',
      'Closing costs',
      'Future space needs',
      'Maintenance capabilities',
    ],
    recommendation: 'Start with a clear budget and must-have list. Be prepared to compromise on wants but not needs.',
    confidence: 'high',
    disclaimer: 'This is AI-generated general advice. Everyone\'s situation is unique. Consult with professionals for personalized guidance.',
  },
}

export class MockLLMProvider implements LLMProvider {
  name = 'Mock Provider'

  async complete(params: LLMCompletionParams): Promise<LLMResponse> {
    // Simulate network delay
    await this.simulateDelay()

    // Get the last user message
    const userMessage = params.messages
      .filter((m) => m.role === 'user')
      .pop()

    const content = userMessage
      ? `This is a mock response to: "${userMessage.content.substring(0, 100)}..."\n\nIn production, this would be a response from an AI model like GPT-4 or Llama.`
      : 'This is a mock LLM response. Configure a real provider for actual AI responses.'

    return {
      content,
      model: 'mock-model',
      usage: {
        promptTokens: Math.floor(Math.random() * 500) + 100,
        completionTokens: Math.floor(Math.random() * 300) + 50,
        totalTokens: Math.floor(Math.random() * 800) + 150,
      },
    }
  }

  async getMarketInsight(request: MarketInsightRequest): Promise<MarketInsight> {
    await this.simulateDelay()

    // Get the appropriate mock insight
    const insight = MOCK_MARKET_INSIGHTS[request.questionType] || MOCK_MARKET_INSIGHTS.general

    // Customize with location if provided
    const customizedInsight = { ...insight }
    if (request.location) {
      customizedInsight.summary = customizedInsight.summary.replace(
        'Based on general market trends',
        `For the ${request.location} area`
      )
    }

    return customizedInsight
  }

  async isAvailable(): Promise<boolean> {
    // Mock provider is always available
    return true
  }

  private async simulateDelay(): Promise<void> {
    // Simulate 200-500ms network delay (LLM responses take longer)
    const delay = 200 + Math.random() * 300
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}
