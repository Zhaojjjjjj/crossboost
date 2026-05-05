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
  requiredInput: ['productName', 'productDescription', 'targetMarket'] as const,
  optionalInput: [
    'productImages',
    'videoType',
    'duration',
    'provider',
    'resolution',
    'aspectRatio',
  ] as const,
  outputSchema: {
    taskId: 'string',
    provider: 'string',
    status: 'string',
    videoUrl: 'string?',
    thumbnailUrl: 'string?',
    error: 'string?',
  },
}
