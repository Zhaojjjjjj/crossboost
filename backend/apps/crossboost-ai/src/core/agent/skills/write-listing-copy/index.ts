/**
 * Write Listing Copy Skill
 *
 * Generates SEO-optimized product listing copy for cross-border e-commerce platforms
 * including titles, bullet points, descriptions, and keywords.
 */

export interface WriteListingCopyInput {
  /** Product name */
  productName: string
  /** Key product features/selling points */
  productFeatures: string[]
  /** Target language for the listing (e.g., "English", "Japanese", "German") */
  targetLanguage: string
  /** Target market (e.g., "US", "Japan", "EU") */
  targetMarket: string
  /** E-commerce platform (e.g., "Amazon", "Shopify", "TikTok Shop") */
  platform: string
  /** Writing tone */
  tone?: 'professional' | 'casual' | 'luxury' | 'playful'
  /** Maximum description length in characters */
  maxLength?: number
  /** Whether to include SEO keyword generation */
  includeSeoKeywords?: boolean
  /** Additional context (brand voice, competitor info, etc.) */
  additionalContext?: string
}

export interface WriteListingCopyOutput {
  /** Product title */
  title: string
  /** Key bullet points (typically 5) */
  bulletPoints: string[]
  /** Full product description */
  description: string
  /** SEO keywords */
  seoKeywords: string[]
  /** Target language */
  language: string
  /** Target market */
  market: string
  /** Platform */
  platform: string
}

export const SKILL_DEFINITION = {
  name: 'write-listing-copy' as const,
  description: 'Generate SEO-optimized product listing copy for cross-border e-commerce platforms',
  requiredInput: ['productName', 'productFeatures', 'targetLanguage', 'targetMarket', 'platform'] as const,
  optionalInput: ['tone', 'maxLength', 'includeSeoKeywords', 'additionalContext'] as const,
  outputSchema: {
    title: 'string',
    bulletPoints: 'string[]',
    description: 'string',
    seoKeywords: 'string[]',
    language: 'string',
    market: 'string',
    platform: 'string',
  },
}
