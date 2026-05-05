import { Injectable, Logger } from '@nestjs/common'
import { config } from '../../../config'
import { OpenAiVideoProvider } from './providers/openai.provider'
import { GeminiVideoProvider } from './providers/gemini.provider'
import { GrokVideoProvider } from './providers/grok.provider'
import { VolcengineVideoProvider } from './providers/volcengine.provider'

export type VideoProvider = 'openai' | 'gemini' | 'grok' | 'volcengine'

export interface GenerateVideoOptions {
  prompt: string
  provider?: VideoProvider
  model?: string
  duration?: number
  resolution?: '720p' | '1080p' | '4k'
  aspectRatio?: '16:9' | '9:16' | '1:1'
  /** Reference image URL to animate */
  referenceImageUrl?: string
}

export interface VideoGenerationTask {
  taskId: string
  provider: VideoProvider
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
  estimatedCompletionTime?: number
}

export interface ProductVideoContext {
  productName: string
  productDescription: string
  productImages: string[]
  targetMarket: string
  videoType: 'product-showcase' | 'unboxing' | 'lifestyle' | 'tutorial'
  duration?: number
}

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name)

  constructor(
    private readonly openaiProvider: OpenAiVideoProvider,
    private readonly geminiProvider: GeminiVideoProvider,
    private readonly grokProvider: GrokVideoProvider,
    private readonly volcengineProvider: VolcengineVideoProvider,
  ) {}

  /**
   * Generate a video from a text prompt or reference image.
   * Returns a task ID for polling status.
   */
  async generateVideo(options: GenerateVideoOptions): Promise<VideoGenerationTask> {
    const provider = options.provider ?? this.selectDefaultProvider()
    this.logger.log(`Video generation: provider=${provider}, prompt="${options.prompt.slice(0, 80)}..."`)

    const impl = this.getProvider(provider)
    return impl.generate(options)
  }

  /**
   * Generate a product video optimized for e-commerce platforms.
   */
  async generateProductVideo(context: ProductVideoContext): Promise<VideoGenerationTask> {
    const prompt = this.buildProductVideoPrompt(context)

    return this.generateVideo({
      prompt,
      duration: context.duration ?? 15,
      aspectRatio: '9:16', // Vertical for mobile-first e-commerce
      referenceImageUrl: context.productImages[0],
    })
  }

  /**
   * Check the status of a video generation task.
   */
  async getTaskStatus(taskId: string, provider: VideoProvider): Promise<VideoGenerationTask> {
    const impl = this.getProvider(provider)
    return impl.getStatus(taskId)
  }

  /**
   * Cancel a video generation task.
   */
  async cancelTask(taskId: string, provider: VideoProvider): Promise<void> {
    const impl = this.getProvider(provider)
    return impl.cancel(taskId)
  }

  /**
   * Get list of available video providers based on configuration.
   */
  getAvailableProviders(): VideoProvider[] {
    const providers: VideoProvider[] = []
    if (config.OPENAI_API_KEY) providers.push('openai')
    if (config.GEMINI_API_KEY) providers.push('gemini')
    if (config.GROK_API_KEY) providers.push('grok')
    if (config.VOLCENGINE_ACCESS_KEY) providers.push('volcengine')
    return providers
  }

  private getProvider(provider: VideoProvider) {
    switch (provider) {
      case 'openai':
        return this.openaiProvider
      case 'gemini':
        return this.geminiProvider
      case 'grok':
        return this.grokProvider
      case 'volcengine':
        return this.volcengineProvider
      default:
        throw new Error(`Unknown video provider: ${provider}`)
    }
  }

  private selectDefaultProvider(): VideoProvider {
    const available = this.getAvailableProviders()
    if (available.length === 0) {
      throw new Error('No video generation provider configured')
    }
    // Prefer volcengine for video (best quality for e-commerce), then openai, then others
    if (available.includes('volcengine')) return 'volcengine'
    if (available.includes('openai')) return 'openai'
    return available[0]
  }

  private buildProductVideoPrompt(context: ProductVideoContext): string {
    const typePrompts = {
      'product-showcase': `Create a sleek product showcase video for "${context.productName}". ${context.productDescription}. Highlight key features with smooth camera movements, professional lighting, and elegant transitions. Target market: ${context.targetMarket}.`,
      unboxing: `Create an engaging unboxing video for "${context.productName}". Show the packaging reveal, product details, and first impressions. Warm, inviting atmosphere. Target market: ${context.targetMarket}.`,
      lifestyle: `Create a lifestyle video showing "${context.productName}" in everyday use. ${context.productDescription}. Natural, relatable场景 with real people. Target market: ${context.targetMarket}.`,
      tutorial: `Create a tutorial/how-to video for "${context.productName}". ${context.productDescription}. Clear step-by-step演示 with close-up shots. Target market: ${context.targetMarket}.`,
    }

    return typePrompts[context.videoType]
  }
}
