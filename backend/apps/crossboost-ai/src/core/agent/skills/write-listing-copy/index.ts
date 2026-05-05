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
  parameters: {
    productName: { type: 'string', description: 'Product name' },
    productFeatures: { type: 'array', description: 'Key product features/selling points' },
    targetLanguage: {
      type: 'string',
      description: 'Target language for the listing (e.g., English, Japanese)',
    },
    targetMarket: { type: 'string', description: 'Target market (e.g., US, Japan, EU)' },
    platform: {
      type: 'string',
      description: 'E-commerce platform (e.g., Amazon, Shopify, TikTok Shop)',
    },
    tone: {
      type: 'string',
      description: 'Writing tone: professional, casual, luxury, playful',
      default: 'professional',
    },
    maxLength: { type: 'number', description: 'Maximum description length in characters' },
    includeSeoKeywords: {
      type: 'boolean',
      description: 'Whether to include SEO keyword generation',
      default: true,
    },
    additionalContext: {
      type: 'string',
      description: 'Additional context (brand voice, competitor info)',
      default: '',
    },
  },
}

export async function execute(params: Record<string, any>, context: any) {
  const {
    productName,
    productFeatures,
    targetLanguage,
    targetMarket,
    platform,
    tone = 'professional',
    maxLength,
    includeSeoKeywords = true,
    additionalContext = '',
  } = params

  // Generate the listing copy using the chat service
  const listingCopy = await context.chatService.generateListingCopy({
    productName,
    productFeatures,
    targetLanguage,
    targetMarket,
    platform,
    tone,
    maxLength,
    includeSeoKeywords,
  })

  // Generate SEO keywords separately if not included
  let seoKeywords = listingCopy.seoKeywords ?? []
  if (includeSeoKeywords && seoKeywords.length === 0) {
    seoKeywords = await context.chatService.generateSeoKeywords(
      productName,
      productFeatures,
      targetMarket,
      targetLanguage,
    )
  }

  return {
    type: 'listing',
    title: listingCopy.title,
    bulletPoints: listingCopy.bulletPoints,
    description: listingCopy.description,
    seoKeywords,
    language: targetLanguage,
    market: targetMarket,
    platform,
    metadata: {
      productName,
      tone,
      maxLength,
      featureCount: productFeatures.length,
    },
  }
}
