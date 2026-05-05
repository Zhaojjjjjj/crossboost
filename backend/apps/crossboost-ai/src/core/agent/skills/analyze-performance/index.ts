/**
 * Analyze Performance Skill
 *
 * Analyzes content performance metrics and provides actionable optimization
 * suggestions for e-commerce listings.
 */

export interface AnalyzePerformanceInput {
  /** Content/listing ID to analyze */
  contentId: string
  /** Performance metrics */
  metrics: {
    /** Page views */
    views?: number
    /** Click-through rate */
    ctr?: number
    /** Conversion rate */
    conversionRate?: number
    /** Add-to-cart rate */
    addToCartRate?: number
    /** Bounce rate */
    bounceRate?: number
    /** Average time on page (seconds) */
    avgTimeOnPage?: number
    /** Revenue generated */
    revenue?: number
    /** Units sold */
    unitsSold?: number
    /** Review count */
    reviewCount?: number
    /** Average rating */
    avgRating?: number
    /** Custom metrics */
    [key: string]: unknown
  }
  /** Competitor data for comparison */
  competitorData?: {
    /** Competitor listing URLs or IDs */
    competitors: Array<{
      id: string
      metrics: Record<string, unknown>
    }>
  }
  /** Current market trends */
  marketTrends?: {
    /** Trending keywords */
    trendingKeywords?: string[]
    /** Seasonal factors */
    seasonalFactors?: string[]
    /** Market growth rate */
    growthRate?: number
  }
}

export interface AnalyzePerformanceOutput {
  /** Content ID analyzed */
  contentId: string
  /** Overall performance score (1-100) */
  score: number
  /** Brief summary of findings */
  summary: string
  /** Identified strengths */
  strengths: string[]
  /** Identified weaknesses */
  weaknesses: string[]
  /** Optimization suggestions */
  suggestions: Array<{
    /** Area of improvement */
    area: string
    /** Specific suggestion */
    suggestion: string
    /** Expected impact (e.g., "+15% CTR") */
    expectedImpact: string
  }>
  /** Comparison with competitors */
  competitorComparison?: string
}

export const SKILL_DEFINITION = {
  name: 'analyze-performance' as const,
  description: 'Analyze content performance metrics and provide optimization suggestions',
  parameters: {
    contentId: { type: 'string', description: 'Content/listing ID to analyze' },
    metrics: { type: 'object', description: 'Performance metrics object with views, CTR, conversion rate, etc.' },
    competitorData: {
      type: 'object',
      description: 'Competitor data for comparison',
      default: null,
    },
    marketTrends: {
      type: 'object',
      description: 'Current market trends (trending keywords, seasonal factors)',
      default: null,
    },
  },
}

export async function execute(params: Record<string, any>, context: any) {
  const { contentId, metrics, competitorData, marketTrends } = params

  // Build a comprehensive analysis prompt
  const analysisPrompt = buildAnalysisPrompt(contentId, metrics, competitorData, marketTrends)

  // Generate AI-powered analysis
  const analysis = await context.chatService.chat({
    messages: [
      {
        role: 'system',
        content: `You are an expert e-commerce content performance analyst with deep knowledge of cross-border e-commerce.
Analyze the provided metrics and give actionable, data-driven optimization suggestions.
Consider platform-specific best practices, market trends, and competitive landscape.
Return JSON with: {
  "score": <1-100 overall performance score>,
  "summary": "<brief summary of findings>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "suggestions": [
    { "area": "<area>", "suggestion": "<specific suggestion>", "expectedImpact": "<e.g. +15% CTR>" }
  ],
  "competitorComparison": "<comparison summary if competitor data provided>"
}`,
      },
      { role: 'user', content: analysisPrompt },
    ],
    temperature: 0.3,
  })

  // Parse the AI response
  let parsed: Record<string, any>
  try {
    parsed = JSON.parse(analysis.content)
  } catch {
    parsed = {
      score: 50,
      summary: analysis.content,
      strengths: [],
      weaknesses: [],
      suggestions: [],
    }
  }

  return {
    type: 'analysis',
    contentId,
    score: parsed.score ?? 50,
    summary: parsed.summary ?? '',
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    suggestions: parsed.suggestions ?? [],
    competitorComparison: parsed.competitorComparison ?? undefined,
    metadata: {
      metricKeys: Object.keys(metrics),
      hasCompetitorData: !!competitorData,
      hasMarketTrends: !!marketTrends,
    },
  }
}

function buildAnalysisPrompt(
  contentId: string,
  metrics: Record<string, any>,
  competitorData?: { competitors: Array<{ id: string; metrics: Record<string, unknown> }> },
  marketTrends?: {
    trendingKeywords?: string[]
    seasonalFactors?: string[]
    growthRate?: number
  },
): string {
  let prompt = `Analyze the performance of content listing "${contentId}".

Performance Metrics:
${JSON.stringify(metrics, null, 2)}`

  if (competitorData?.competitors?.length) {
    prompt += `\n\nCompetitor Data:
${JSON.stringify(competitorData.competitors, null, 2)}`
  }

  if (marketTrends) {
    prompt += `\n\nMarket Trends:
${JSON.stringify(marketTrends, null, 2)}`
  }

  prompt += `

Please provide:
1. An overall performance score (1-100)
2. A concise summary of the key findings
3. Top strengths (what's working well)
4. Key weaknesses (what needs improvement)
5. Specific, actionable optimization suggestions with expected impact
${competitorData ? '6. How this listing compares to competitors' : ''}

Focus on practical, implementable recommendations that can improve conversion rate and visibility.`

  return prompt
}
