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
  parameters: {
    productName: { type: 'string', description: 'Product name' },
    productCategory: {
      type: 'string',
      description: 'Product category (e.g., Electronics, Fashion)',
    },
    targetMarket: { type: 'string', description: 'Target market (e.g., US, Japan, Europe)' },
    style: {
      type: 'string',
      description: 'Image style: lifestyle, white-background, studio, outdoor',
      default: 'white-background',
    },
    aspectRatio: {
      type: 'string',
      description: 'Aspect ratio: square, portrait, landscape',
      default: 'square',
    },
    referenceImages: { type: 'array', description: 'Reference image URLs for style guidance', default: [] },
    variations: { type: 'number', description: 'Number of image variations to generate', default: 4 },
  },
}

export async function execute(params: Record<string, any>, context: any) {
  const {
    productName,
    productCategory,
    targetMarket,
    style = 'white-background',
    aspectRatio = 'square',
    referenceImages = [],
    variations = 4,
  } = params

  // Generate multiple image variations in sequence
  const images: Array<{
    url: string
    revisedPrompt?: string
    style: string
    variation: number
  }> = []

  for (let i = 0; i < variations; i++) {
    const prompt = buildImagePrompt(productName, productCategory, style, i, variations)

    const result = await context.imageService.generateProductImages({
      productName,
      productCategory,
      targetMarket,
      style,
      aspectRatio,
    })

    for (const img of result.images) {
      images.push({
        url: img.url,
        revisedPrompt: img.revisedPrompt,
        style,
        variation: i + 1,
      })
    }
  }

  return {
    type: 'images',
    provider: images.length > 0 ? 'ai-provider' : 'none',
    images,
    metadata: {
      productName,
      productCategory,
      targetMarket,
      style,
      aspectRatio,
      totalGenerated: images.length,
    },
  }
}

function buildImagePrompt(
  productName: string,
  productCategory: string,
  style: string,
  index: number,
  total: number,
): string {
  const stylePrompts: Record<string, string> = {
    lifestyle:
      'Professional lifestyle product photography with natural lighting and real-world context',
    'white-background':
      'Clean e-commerce product photography on pure white background with soft shadows',
    studio:
      'High-end studio product photography with dramatic lighting and premium feel',
    outdoor:
      'Outdoor product photography with natural environment and adventure vibes',
  }

  const base = stylePrompts[style] || stylePrompts['white-background']

  const angleVariations = [
    'front angle, hero shot',
    'three-quarter angle, showing depth',
    'close-up detail shot of key features',
    'in-use or styled context shot',
  ]
  const angle = angleVariations[index % angleVariations.length]

  return `${base}.

Product: ${productName} (${productCategory})
Shot: ${angle} (variation ${index + 1} of ${total})

Requirements:
- Ultra high quality, 4K resolution
- Professional commercial photography standards
- Sharp focus with appealing bokeh where appropriate
- Color accurate representation of the product`
}
