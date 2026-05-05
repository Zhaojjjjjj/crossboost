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
  requiredInput: ['contentId', 'metrics'] as const,
  optionalInput: ['competitorData', 'marketTrends'] as const,
  outputSchema: {
    contentId: 'string',
    score: 'number',
    summary: 'string',
    strengths: 'string[]',
    weaknesses: 'string[]',
    suggestions: 'Array<{ area: string, suggestion: string, expectedImpact: string }>',
    competitorComparison: 'string?',
  },
}
