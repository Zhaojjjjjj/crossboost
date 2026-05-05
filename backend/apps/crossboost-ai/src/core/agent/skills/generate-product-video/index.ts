/**
 * Generate Product Video Skill
 *
 * Generates product showcase, unboxing, lifestyle, or tutorial videos
 * using multi-provider video generation (OpenAI Sora, Gemini Veo, Grok, Volcengine Jimeng).
 */

export interface GenerateProductVideoInput {
  /** Product name */
  productName: string
  /** Detailed product description */
  productDescription: string
  /** Target market (e.g., "US", "Japan", "Southeast Asia") */
  targetMarket: string
  /** Product image URLs for reference */
  productImages?: string[]
  /** Video type */
  videoType?: 'product-showcase' | 'unboxing' | 'lifestyle' | 'tutorial'
  /** Video duration in seconds (default: 15) */
  duration?: number
  /** Preferred video provider */
  provider?: 'openai' | 'gemini' | 'grok' | 'volcengine'
  /** Resolution preference */
  resolution?: '720p' | '1080p' | '4k'
  /** Aspect ratio */
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

export interface GenerateProductVideoOutput {
  /** Generation task ID */
  taskId: string
  /** Video provider used */
  provider: string
  /** Task status */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Generated video URL (available when completed) */
  videoUrl?: string
  /** Video thumbnail URL */
  thumbnailUrl?: string
  /** Error message if failed */
  error?: string
}

export const SKILL_DEFINITION = {
  name: 'generate-product-video' as const,
  description: 'Generate product videos for e-commerce listings using AI video generation providers',
  parameters: {
    productName: { type: 'string', description: 'Product name' },
    productDescription: { type: 'string', description: 'Detailed product description' },
    targetMarket: { type: 'string', description: 'Target market (e.g., "US", "Japan")' },
    productImages: { type: 'array', description: 'Product image URLs for reference', default: [] },
    videoType: {
      type: 'string',
      description: 'Video style: product-showcase, unboxing, lifestyle, tutorial',
      default: 'product-showcase',
    },
    duration: { type: 'number', description: 'Video duration in seconds', default: 15 },
    provider: {
      type: 'string',
      description: 'Preferred video provider: openai, gemini, grok, volcengine',
    },
    resolution: { type: 'string', description: 'Resolution: 720p, 1080p, 4k', default: '1080p' },
    aspectRatio: {
      type: 'string',
      description: 'Aspect ratio: 16:9 for YouTube, 9:16 for TikTok/Reels, 1:1 for Instagram',
      default: '9:16',
    },
  },
}

export async function execute(params: Record<string, any>, context: any) {
  const {
    productName,
    productDescription,
    targetMarket,
    productImages = [],
    videoType = 'product-showcase',
    duration = 15,
    provider,
    resolution = '1080p',
    aspectRatio = '9:16',
  } = params

  // Build a rich video prompt from product information
  const prompt = buildVideoPrompt(productName, productDescription, videoType, targetMarket)

  // Generate video using the AI video service
  const videoResult = await context.videoService.generateProductVideo({
    productName,
    productDescription,
    productImages,
    targetMarket,
    videoType,
    duration,
    provider,
    resolution,
    aspectRatio,
  })

  // Poll for completion if the provider supports status checks
  let status = videoResult
  const maxAttempts = 60
  for (let i = 0; i < maxAttempts; i++) {
    if (status.status === 'completed' || status.status === 'failed') {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))

    try {
      status = await context.videoService.getTaskStatus(status.taskId, status.provider)
    } catch {
      // Provider may not support status polling; return what we have
      break
    }
  }

  return {
    type: 'video',
    taskId: status.taskId,
    provider: status.provider,
    url: status.videoUrl,
    thumbnail: status.thumbnailUrl,
    status: status.status,
    error: status.error,
    metadata: {
      productName,
      videoType,
      duration,
      resolution,
      aspectRatio,
      targetMarket,
    },
  }
}

function buildVideoPrompt(
  productName: string,
  productDescription: string,
  videoType: string,
  targetMarket: string,
): string {
  const stylePrompts: Record<string, string> = {
    'product-showcase':
      'Create a cinematic product showcase video highlighting key features and design details',
    unboxing:
      'Create an exciting unboxing video with satisfying reveals and product presentation',
    lifestyle:
      'Create a lifestyle video showing the product in real-world everyday use scenarios',
    tutorial:
      'Create a tutorial video demonstrating how to use the product step by step',
  }

  const base = stylePrompts[videoType] || stylePrompts['product-showcase']

  return `${base}.

Product: ${productName}
Description: ${productDescription}
Target Market: ${targetMarket}

Requirements:
- High production quality with smooth transitions
- Engaging opening hook in the first 3 seconds
- Clear product visibility and feature highlights
- Suitable for social media platforms`
}
