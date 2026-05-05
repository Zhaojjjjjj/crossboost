/**
 * Generate Product Images Skill
 *
 * Creates product listing images in various styles (white background, lifestyle,
 * studio, outdoor) optimized for e-commerce platforms.
 */

export interface GenerateProductImagesInput {
  /** Product name */
  productName: string
  /** Product category (e.g., "Electronics", "Fashion", "Home & Garden") */
  productCategory: string
  /** Target market (e.g., "US", "Japan", "Europe") */
  targetMarket: string
  /** Image style */
  style?: 'lifestyle' | 'white-background' | 'studio' | 'outdoor'
  /** Aspect ratio */
  aspectRatio?: 'square' | 'portrait' | 'landscape'
  /** Reference images for style guidance */
  referenceImages?: string[]
  /** Number of variations to generate */
  variations?: number
}

export interface GenerateProductImagesOutput {
  /** Provider used for generation */
  provider: string
  /** Model used */
  model: string
  /** Generated images */
  images: Array<{
    /** Image URL */
    url: string
    /** Revised prompt used (if provider modified it) */
    revisedPrompt?: string
  }>
}

export const SKILL_DEFINITION = {
  name: 'generate-product-images' as const,
  description: 'Generate professional product images for e-commerce listings with various styles',
  requiredInput: ['productName', 'productCategory', 'targetMarket'] as const,
  optionalInput: ['style', 'aspectRatio', 'referenceImages', 'variations'] as const,
  outputSchema: {
    provider: 'string',
    model: 'string',
    images: 'Array<{ url: string, revisedPrompt?: string }>',
  },
}
