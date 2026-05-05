import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { config } from '../../../config'

export type ImageProvider = 'openai'

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792'
export type ImageQuality = 'standard' | 'hd'
export type ImageStyle = 'vivid' | 'natural'

export interface GenerateImageOptions {
  prompt: string
  provider?: ImageProvider
  model?: string
  size?: ImageSize
  quality?: ImageQuality
  style?: ImageStyle
  n?: number
  /** Reference image URL for editing/variations */
  referenceImageUrl?: string
}

export interface GeneratedImage {
  url: string
  revisedPrompt?: string
}

export interface GenerateImageResult {
  provider: ImageProvider
  model: string
  images: GeneratedImage[]
}

export interface ProductImageContext {
  productName: string
  productCategory: string
  targetMarket: string
  style?: 'lifestyle' | 'white-background' | 'studio' | 'outdoor'
  aspectRatio?: 'square' | 'portrait' | 'landscape'
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name)
  private openaiClient: OpenAI | null = null

  private getOpenAIClient(): OpenAI {
    if (!this.openaiClient) {
      if (!config.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured for image generation')
      }
      this.openaiClient = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
        baseURL: config.OPENAI_BASE_URL,
      })
    }
    return this.openaiClient
  }

  /**
   * Generate an image from a text prompt.
   */
  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const provider = options.provider ?? 'openai'
    this.logger.log(`Image generation: provider=${provider}, prompt="${options.prompt.slice(0, 80)}..."`)

    switch (provider) {
      case 'openai':
      default:
        return this.generateWithOpenAI(options)
    }
  }

  /**
   * Generate product listing images optimized for e-commerce platforms.
   */
  async generateProductImages(context: ProductImageContext): Promise<GenerateImageResult> {
    const prompt = this.buildProductImagePrompt(context)
    const size = this.mapAspectRatio(context.aspectRatio ?? 'square')

    return this.generateImage({
      prompt,
      size,
      quality: 'hd',
      style: context.style === 'lifestyle' ? 'natural' : 'vivid',
    })
  }

  /**
   * Generate marketing banner/visual for a product campaign.
   */
  async generateMarketingVisual(options: {
    productName: string
    campaignTheme: string
    targetMarket: string
    dimensions: 'banner' | 'social-square' | 'story'
  }): Promise<GenerateImageResult> {
    const sizeMap = {
      banner: '1792x1024' as ImageSize,
      'social-square': '1024x1024' as ImageSize,
      story: '1024x1792' as ImageSize,
    }

    const prompt = `Create a professional marketing visual for "${options.productName}".
Theme: ${options.campaignTheme}
Target market: ${options.targetMarket}
Style: Modern, eye-catching, suitable for e-commerce advertising.
No text or watermarks. High quality product focus.`

    return this.generateImage({
      prompt,
      size: sizeMap[options.dimensions],
      quality: 'hd',
      style: 'vivid',
    })
  }

  /**
   * Edit an existing image with a prompt (inpainting/outpainting).
   */
  async editImage(options: {
    imageUrl: string
    prompt: string
    maskUrl?: string
    size?: ImageSize
  }): Promise<GenerateImageResult> {
    this.logger.log(`Image edit: prompt="${options.prompt.slice(0, 80)}..."`)

    const client = this.getOpenAIClient()

    // Download the source image
    const imageResponse = await fetch(options.imageUrl)
    const imageBlob = await imageResponse.blob()
    const imageFile = new File([imageBlob], 'source.png', { type: 'image/png' })

    let maskFile: File | undefined
    if (options.maskUrl) {
      const maskResponse = await fetch(options.maskUrl)
      const maskBlob = await maskResponse.blob()
      maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' })
    }

    const response = await client.images.edit({
      model: 'dall-e-3',
      image: imageFile,
      mask: maskFile,
      prompt: options.prompt,
      size: options.size ?? '1024x1024',
      n: 1,
    })

    return {
      provider: 'openai',
      model: 'dall-e-3',
      images: response.data.map((img) => ({
        url: img.url ?? '',
        revisedPrompt: img.revised_prompt ?? undefined,
      })),
    }
  }

  private async generateWithOpenAI(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const client = this.getOpenAIClient()

    const response = await client.images.generate({
      model: options.model ?? 'dall-e-3',
      prompt: options.prompt,
      size: options.size ?? '1024x1024',
      quality: options.quality ?? 'standard',
      style: options.style ?? 'vivid',
      n: options.n ?? 1,
    })

    return {
      provider: 'openai',
      model: options.model ?? 'dall-e-3',
      images: response.data.map((img) => ({
        url: img.url ?? '',
        revisedPrompt: img.revised_prompt ?? undefined,
      })),
    }
  }

  private buildProductImagePrompt(context: ProductImageContext): string {
    const styleMap = {
      lifestyle: `A lifestyle photograph showing ${context.productName} in a real-world usage场景, natural lighting, ${context.targetMarket} aesthetic appeal`,
      'white-background': `A clean, professional product photograph of ${context.productName} on a pure white background, e-commerce ready, high detail`,
      studio: `A studio photograph of ${context.productName} with professional lighting, soft shadows, premium feel, suitable for ${context.targetMarket} market`,
      outdoor: `An outdoor photograph of ${context.productName} in a natural setting, vibrant colors, appealing to ${context.targetMarket} consumers`,
    }

    const style = context.style ?? 'white-background'
    return `${styleMap[style]}. Category: ${context.productCategory}. No text, watermarks, or logos. Ultra high quality, photorealistic.`
  }

  private mapAspectRatio(ratio: 'square' | 'portrait' | 'landscape'): ImageSize {
    switch (ratio) {
      case 'portrait':
        return '1024x1792'
      case 'landscape':
        return '1792x1024'
      case 'square':
      default:
        return '1024x1024'
    }
  }
}
