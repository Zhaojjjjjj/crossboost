import { Injectable, Logger } from '@nestjs/common'
import { ChatService } from '../ai/chat/chat.service'
import { ImageService } from '../ai/image/image.service'

export interface ContentGenPipelineInput {
  /** Product information */
  product: {
    name: string
    description: string
    features: string[]
    category: string
    price?: number
    brand?: string
    images?: string[]
  }
  /** Target markets and languages */
  targets: Array<{
    market: string
    language: string
    platform: string
  }>
  /** Content types to generate */
  contentTypes: Array<'listing' | 'images' | 'social' | 'email' | 'ads'>
  /** Brand guidelines */
  brandGuidelines?: {
    tone: string
    values: string[]
    prohibitedWords?: string[]
  }
}

export interface GeneratedContent {
  /** Market/language target */
  target: {
    market: string
    language: string
    platform: string
  }
  /** Listing copy */
  listing?: {
    title: string
    bulletPoints: string[]
    description: string
    seoKeywords: string[]
  }
  /** Generated images */
  images?: Array<{
    url: string
    style: string
    revisedPrompt?: string
  }>
  /** Social media content */
  social?: {
    caption: string
    hashtags: string[]
    suggestedPostTime?: string
  }
  /** Email content */
  email?: {
    subject: string
    body: string
    cta: string
  }
  /** Ad copy */
  ads?: Array<{
    headline: string
    body: string
    cta: string
    platform: string
  }>
}

export interface ContentGenPipelineResult {
  /** Pipeline execution ID */
  pipelineId: string
  /** Generated content per target */
  results: GeneratedContent[]
  /** Total tokens used */
  totalTokens: number
  /** Processing time in milliseconds */
  processingTimeMs: number
}

@Injectable()
export class ContentGenService {
  private readonly logger = new Logger(ContentGenService.name)

  constructor(
    private readonly chatService: ChatService,
    private readonly imageService: ImageService,
  ) {}

  /**
   * Run the full content generation pipeline for a product across multiple targets.
   */
  async runPipeline(
    input: ContentGenPipelineInput,
    onProgress?: (target: string, progress: number) => void,
  ): Promise<ContentGenPipelineResult> {
    const startTime = Date.now()
    const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    this.logger.log(`Starting content generation pipeline: ${pipelineId}`)

    const results: GeneratedContent[] = []
    let totalTokens = 0

    for (let i = 0; i < input.targets.length; i++) {
      const target = input.targets[i]
      onProgress?.(`${target.market}/${target.language}`, Math.round((i / input.targets.length) * 100))

      const content: GeneratedContent = {
        target,
      }

      // Generate listing copy
      if (input.contentTypes.includes('listing')) {
        this.logger.log(`Generating listing for ${target.market}/${target.platform}`)
        const listing = await this.chatService.generateListingCopy({
          productName: input.product.name,
          productFeatures: input.product.features,
          targetLanguage: target.language,
          targetMarket: target.market,
          platform: target.platform,
          tone: input.brandGuidelines?.tone as 'professional' | 'casual' | 'luxury' | 'playful' | undefined,
          includeSeoKeywords: true,
        })
        content.listing = listing
      }

      // Generate social media content
      if (input.contentTypes.includes('social')) {
        this.logger.log(`Generating social content for ${target.market}`)
        const social = await this.generateSocialContent(input.product, target, input.brandGuidelines)
        content.social = social
      }

      // Generate email content
      if (input.contentTypes.includes('email')) {
        this.logger.log(`Generating email content for ${target.market}`)
        const email = await this.generateEmailContent(input.product, target, input.brandGuidelines)
        content.email = email
      }

      // Generate ad copy
      if (input.contentTypes.includes('ads')) {
        this.logger.log(`Generating ad copy for ${target.market}`)
        const ads = await this.generateAdCopy(input.product, target, input.brandGuidelines)
        content.ads = ads
      }

      results.push(content)
    }

    // Generate images (done once, shared across targets)
    if (input.contentTypes.includes('images')) {
      this.logger.log('Generating product images')
      const imageResult = await this.imageService.generateProductImages({
        productName: input.product.name,
        productCategory: input.product.category,
        targetMarket: input.targets[0]?.market ?? 'global',
        style: 'white-background',
      })

      // Attach images to all results
      for (const result of results) {
        result.images = imageResult.images.map((img) => ({
          url: img.url,
          style: 'white-background',
          revisedPrompt: img.revisedPrompt,
        }))
      }
    }

    onProgress?.('complete', 100)

    return {
      pipelineId,
      results,
      totalTokens,
      processingTimeMs: Date.now() - startTime,
    }
  }

  /**
   * Generate listing copy for a single product/target combination.
   */
  async generateListing(input: {
    productName: string
    productFeatures: string[]
    targetLanguage: string
    targetMarket: string
    platform: string
    tone?: string
    maxLength?: number
  }) {
    return this.chatService.generateListingCopy({
      productName: input.productName,
      productFeatures: input.productFeatures,
      targetLanguage: input.targetLanguage,
      targetMarket: input.targetMarket,
      platform: input.platform,
      tone: input.tone as 'professional' | 'casual' | 'luxury' | 'playful' | undefined,
      maxLength: input.maxLength,
      includeSeoKeywords: true,
    })
  }

  /**
   * Translate existing listing to a new language.
   */
  async translateListing(
    listing: { title: string; bulletPoints: string[]; description: string },
    targetLanguage: string,
    targetMarket: string,
  ) {
    const title = await this.chatService.translateContent(listing.title, targetLanguage, 'Product title')
    const bulletPoints = await Promise.all(
      listing.bulletPoints.map((bp) => this.chatService.translateContent(bp, targetLanguage, 'Product bullet point')),
    )
    const description = await this.chatService.translateContent(listing.description, targetLanguage, 'Product description')

    return { title, bulletPoints, description }
  }

  private async generateSocialContent(
    product: ContentGenPipelineInput['product'],
    target: ContentGenPipelineInput['targets'][0],
    brandGuidelines?: ContentGenPipelineInput['brandGuidelines'],
  ): Promise<{ caption: string; hashtags: string[]; suggestedPostTime?: string }> {
    const result = await this.chatService.chat({
      messages: [
        {
          role: 'system',
          content: `You are a social media marketing expert for ${target.platform}. Create engaging social media content for ${target.market} market in ${target.language}.
${brandGuidelines ? `Brand tone: ${brandGuidelines.tone}. Values: ${brandGuidelines.values.join(', ')}` : ''}
Return JSON with: { "caption": "...", "hashtags": ["..."], "suggestedPostTime": "..." }`,
        },
        {
          role: 'user',
          content: `Product: ${product.name}\nDescription: ${product.description}\nFeatures: ${product.features.join(', ')}`,
        },
      ],
      temperature: 0.8,
    })

    try {
      return JSON.parse(result.content)
    } catch {
      return { caption: result.content, hashtags: [] }
    }
  }

  private async generateEmailContent(
    product: ContentGenPipelineInput['product'],
    target: ContentGenPipelineInput['targets'][0],
    brandGuidelines?: ContentGenPipelineInput['brandGuidelines'],
  ): Promise<{ subject: string; body: string; cta: string }> {
    const result = await this.chatService.chat({
      messages: [
        {
          role: 'system',
          content: `You are an email marketing expert. Create a promotional email for ${target.market} market in ${target.language}.
${brandGuidelines ? `Brand tone: ${brandGuidelines.tone}` : ''}
Return JSON with: { "subject": "...", "body": "...", "cta": "..." }`,
        },
        {
          role: 'user',
          content: `Product: ${product.name}\nDescription: ${product.description}\nFeatures: ${product.features.join(', ')}${product.price ? `\nPrice: ${product.price}` : ''}`,
        },
      ],
      temperature: 0.7,
    })

    try {
      return JSON.parse(result.content)
    } catch {
      return { subject: '', body: result.content, cta: '' }
    }
  }

  private async generateAdCopy(
    product: ContentGenPipelineInput['product'],
    target: ContentGenPipelineInput['targets'][0],
    brandGuidelines?: ContentGenPipelineInput['brandGuidelines'],
  ): Promise<Array<{ headline: string; body: string; cta: string; platform: string }>> {
    const result = await this.chatService.chat({
      messages: [
        {
          role: 'system',
          content: `You are a performance advertising expert. Create ad copy variations for ${target.market} market in ${target.language}.
Generate 3 ad variations for ${target.platform}.
${brandGuidelines ? `Brand tone: ${brandGuidelines.tone}` : ''}
Return JSON array: [{ "headline": "...", "body": "...", "cta": "...", "platform": "..." }]`,
        },
        {
          role: 'user',
          content: `Product: ${product.name}\nDescription: ${product.description}\nFeatures: ${product.features.join(', ')}${product.price ? `\nPrice: ${product.price}` : ''}`,
        },
      ],
      temperature: 0.8,
    })

    try {
      const parsed = JSON.parse(result.content)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return [{ headline: product.name, body: result.content, cta: '', platform: target.platform }]
    }
  }
}
