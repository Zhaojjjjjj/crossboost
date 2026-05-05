import { Injectable, Logger } from '@nestjs/common'
import { ChatService } from '../../ai/chat/chat.service'
import { ImageService } from '../../ai/image/image.service'
import { VideoService } from '../../ai/video/video.service'
import { ContentGenService } from '../../content-gen/content-gen.service'
import type { AgentSkill, AgentLogEntry } from '../agent.service'

export interface SkillExecutionContext {
  onProgress: (progress: number, message?: string) => void
  onLog: (level: AgentLogEntry['level'], message: string, data?: Record<string, unknown>) => void
}

export interface SkillDefinition {
  name: AgentSkill
  description: string
  requiredInput: string[]
  optionalInput: string[]
}

@Injectable()
export class AgentRuntimeService {
  private readonly logger = new Logger(AgentRuntimeService.name)

  constructor(
    private readonly chatService: ChatService,
    private readonly imageService: ImageService,
    private readonly videoService: VideoService,
    private readonly contentGenService: ContentGenService,
  ) {}

  /**
   * Execute a skill with the given input and context.
   */
  async executeSkill(
    skill: AgentSkill,
    input: Record<string, unknown>,
    context: SkillExecutionContext,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Executing skill: ${skill}`)
    context.onLog('info', `Starting skill execution: ${skill}`)

    switch (skill) {
      case 'generate-product-video':
        return this.executeGenerateProductVideo(input, context)
      case 'generate-product-images':
        return this.executeGenerateProductImages(input, context)
      case 'write-listing-copy':
        return this.executeWriteListingCopy(input, context)
      case 'adapt-content':
        return this.executeAdaptContent(input, context)
      case 'analyze-performance':
        return this.executeAnalyzePerformance(input, context)
      default:
        throw new Error(`Unknown skill: ${skill}`)
    }
  }

  /**
   * Get list of available skill definitions.
   */
  getSkillDefinitions(): SkillDefinition[] {
    return [
      {
        name: 'generate-product-video',
        description: 'Generate a product video from product information and images',
        requiredInput: ['productName', 'productDescription', 'targetMarket'],
        optionalInput: ['productImages', 'videoType', 'duration'],
      },
      {
        name: 'generate-product-images',
        description: 'Generate product listing images with various styles',
        requiredInput: ['productName', 'productCategory', 'targetMarket'],
        optionalInput: ['style', 'aspectRatio', 'referenceImages'],
      },
      {
        name: 'write-listing-copy',
        description: 'Write SEO-optimized product listing copy for e-commerce platforms',
        requiredInput: ['productName', 'productFeatures', 'targetLanguage', 'targetMarket', 'platform'],
        optionalInput: ['tone', 'maxLength', 'includeSeoKeywords'],
      },
      {
        name: 'adapt-content',
        description: 'Adapt existing content for different platforms, languages, or markets',
        requiredInput: ['content', 'targetPlatform', 'targetLanguage'],
        optionalInput: ['sourcePlatform', 'preserveSeo', 'tone'],
      },
      {
        name: 'analyze-performance',
        description: 'Analyze content performance metrics and provide optimization suggestions',
        requiredInput: ['contentId', 'metrics'],
        optionalInput: ['competitorData', 'marketTrends'],
      },
    ]
  }

  private async executeGenerateProductVideo(
    input: Record<string, unknown>,
    context: SkillExecutionContext,
  ): Promise<Record<string, unknown>> {
    context.onProgress(10, 'Preparing video generation')

    const productName = input.productName as string
    const productDescription = input.productDescription as string
    const targetMarket = input.targetMarket as string
    const productImages = (input.productImages as string[]) ?? []
    const videoType = (input.videoType as string ?? 'product-showcase') as
      | 'product-showcase'
      | 'unboxing'
      | 'lifestyle'
      | 'tutorial'

    context.onProgress(30, 'Submitting video generation request')
    context.onLog('info', `Generating ${videoType} video for ${productName}`)

    const result = await this.videoService.generateProductVideo({
      productName,
      productDescription,
      productImages,
      targetMarket,
      videoType,
      duration: input.duration as number | undefined,
    })

    context.onProgress(60, 'Video generation submitted, monitoring progress')

    // Poll for completion (in a real implementation, this would use webhooks or a queue)
    let status = result
    const maxAttempts = 60
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000))

      try {
        status = await this.videoService.getTaskStatus(result.taskId, result.provider)
      } catch {
        // Provider may not support status polling
        break
      }

      const progress = 60 + Math.round((i / maxAttempts) * 35)
      context.onProgress(progress, `Video status: ${status.status}`)

      if (status.status === 'completed' || status.status === 'failed') {
        break
      }
    }

    context.onProgress(100, 'Video generation complete')

    return {
      taskId: status.taskId,
      provider: status.provider,
      status: status.status,
      videoUrl: status.videoUrl,
      thumbnailUrl: status.thumbnailUrl,
      error: status.error,
    }
  }

  private async executeGenerateProductImages(
    input: Record<string, unknown>,
    context: SkillExecutionContext,
  ): Promise<Record<string, unknown>> {
    context.onProgress(10, 'Preparing image generation')

    const productName = input.productName as string
    const productCategory = input.productCategory as string
    const targetMarket = input.targetMarket as string
    const style = (input.style as string ?? 'white-background') as
      | 'lifestyle'
      | 'white-background'
      | 'studio'
      | 'outdoor'
    const aspectRatio = (input.aspectRatio as string ?? 'square') as
      | 'square'
      | 'portrait'
      | 'landscape'

    context.onProgress(30, 'Generating product images')
    context.onLog('info', `Generating ${style} images for ${productName}`)

    const result = await this.imageService.generateProductImages({
      productName,
      productCategory,
      targetMarket,
      style,
      aspectRatio,
    })

    context.onProgress(80, 'Images generated, processing results')
    context.onProgress(100, 'Image generation complete')

    return {
      provider: result.provider,
      model: result.model,
      images: result.images,
    }
  }

  private async executeWriteListingCopy(
    input: Record<string, unknown>,
    context: SkillExecutionContext,
  ): Promise<Record<string, unknown>> {
    context.onProgress(10, 'Analyzing product information')

    const productName = input.productName as string
    const productFeatures = input.productFeatures as string[]
    const targetLanguage = input.targetLanguage as string
    const targetMarket = input.targetMarket as string
    const platform = input.platform as string

    context.onProgress(30, 'Generating listing copy')
    context.onLog('info', `Writing ${platform} listing for ${productName} in ${targetLanguage}`)

    // Generate listing copy
    const listingCopy = await this.chatService.generateListingCopy({
      productName,
      productFeatures,
      targetLanguage,
      targetMarket,
      platform,
      tone: input.tone as 'professional' | 'casual' | 'luxury' | 'playful' | undefined,
      maxLength: input.maxLength as number | undefined,
      includeSeoKeywords: input.includeSeoKeywords as boolean | undefined,
    })

    context.onProgress(70, 'Listing copy generated, generating SEO keywords')

    // Generate additional SEO keywords if not included
    let seoKeywords = listingCopy.seoKeywords
    if (seoKeywords.length === 0) {
      seoKeywords = await this.chatService.generateSeoKeywords(
        productName,
        productFeatures,
        targetMarket,
        targetLanguage,
      )
    }

    context.onProgress(90, 'Finalizing listing')
    context.onProgress(100, 'Listing copy complete')

    return {
      title: listingCopy.title,
      bulletPoints: listingCopy.bulletPoints,
      description: listingCopy.description,
      seoKeywords,
      language: targetLanguage,
      market: targetMarket,
      platform,
    }
  }

  private async executeAdaptContent(
    input: Record<string, unknown>,
    context: SkillExecutionContext,
  ): Promise<Record<string, unknown>> {
    context.onProgress(10, 'Analyzing source content')

    const content = input.content as string
    const targetPlatform = input.targetPlatform as string
    const targetLanguage = input.targetLanguage as string
    const tone = input.tone as string | undefined

    context.onProgress(30, 'Adapting content for target platform')
    context.onLog('info', `Adapting content for ${targetPlatform} in ${targetLanguage}`)

    // Use chat service to adapt content
    const adaptedContent = await this.chatService.chat({
      messages: [
        {
          role: 'system',
          content: `You are a cross-platform content adaptation expert. Adapt the given content for the ${targetPlatform} platform in ${targetLanguage}.
${tone ? `Tone: ${tone}` : ''}
Preserve the core message while optimizing for the target platform's best practices, character limits, and audience expectations.
Return JSON with: { "adaptedContent": "...", "platform": "...", "changes": ["..."] }`,
        },
        { role: 'user', content },
      ],
      temperature: 0.5,
    })

    context.onProgress(70, 'Content adapted, translating if needed')

    let translatedContent: string | undefined
    if (targetLanguage !== 'en') {
      translatedContent = await this.chatService.translateContent(
        adaptedContent.content,
        targetLanguage,
        `Platform: ${targetPlatform}`,
      )
    }

    context.onProgress(100, 'Content adaptation complete')

    let parsed: { adaptedContent?: string; changes?: string[] }
    try {
      parsed = JSON.parse(adaptedContent.content)
    } catch {
      parsed = { adaptedContent: adaptedContent.content, changes: [] }
    }

    return {
      adaptedContent: parsed.adaptedContent ?? adaptedContent.content,
      translatedContent,
      platform: targetPlatform,
      language: targetLanguage,
      changes: parsed.changes ?? [],
    }
  }

  private async executeAnalyzePerformance(
    input: Record<string, unknown>,
    context: SkillExecutionContext,
  ): Promise<Record<string, unknown>> {
    context.onProgress(10, 'Loading performance data')

    const contentId = input.contentId as string
    const metrics = input.metrics as Record<string, unknown>

    context.onProgress(30, 'Analyzing performance metrics')
    context.onLog('info', `Analyzing performance for content: ${contentId}`)

    // Use chat service to analyze metrics and provide suggestions
    const analysis = await this.chatService.chat({
      messages: [
        {
          role: 'system',
          content: `You are an e-commerce content performance analyst. Analyze the provided metrics and give actionable optimization suggestions.
Return JSON with: {
  "score": <1-100>,
  "summary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": [{ "area": "...", "suggestion": "...", "expectedImpact": "..." }],
  "competitorComparison": "..."
}`,
        },
        {
          role: 'user',
          content: `Content ID: ${contentId}\nMetrics:\n${JSON.stringify(metrics, null, 2)}${input.competitorData ? `\nCompetitor data:\n${JSON.stringify(input.competitorData, null, 2)}` : ''}${input.marketTrends ? `\nMarket trends:\n${JSON.stringify(input.marketTrends, null, 2)}` : ''}`,
        },
      ],
      temperature: 0.3,
    })

    context.onProgress(80, 'Generating optimization report')
    context.onProgress(100, 'Analysis complete')

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(analysis.content)
    } catch {
      parsed = { summary: analysis.content }
    }

    return {
      contentId,
      ...parsed,
    }
  }
}
