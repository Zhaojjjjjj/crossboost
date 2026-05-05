import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { config } from '../../../../config'
import type { GenerateVideoOptions, VideoGenerationTask, VideoProvider as VideoProviderType } from '../video.service'

export interface VideoProviderInterface {
  generate(options: GenerateVideoOptions): Promise<VideoGenerationTask>
  getStatus(taskId: string): Promise<VideoGenerationTask>
  cancel(taskId: string): Promise<void>
}

@Injectable()
export class OpenAiVideoProvider implements VideoProviderInterface {
  private readonly logger = new Logger(OpenAiVideoProvider.name)
  private client: OpenAI | null = null

  private getClient(): OpenAI {
    if (!this.client) {
      if (!config.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured')
      }
      this.client = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
        baseURL: config.OPENAI_BASE_URL,
      })
    }
    return this.client
  }

  async generate(options: GenerateVideoOptions): Promise<VideoGenerationTask> {
    this.logger.log('Generating video with OpenAI Sora')
    const client = this.getClient()

    try {
      const params: Record<string, unknown> = {
        model: options.model ?? 'sora',
        prompt: options.prompt,
        duration: options.duration ?? 15,
        size: this.mapResolution(options.resolution, options.aspectRatio),
      }

      if (options.referenceImageUrl) {
        params.image_url = options.referenceImageUrl
      }

      // OpenAI Sora video generation API
      // Note: The actual API shape may differ; this is based on the expected interface
      const response = await (client as unknown as { video: { generations: { create: (p: Record<string, unknown>) => Promise<{ id: string; status: string }> } } }).video.generations.create(params)

      return {
        taskId: response.id,
        provider: 'openai',
        status: this.mapStatus(response.status),
      }
    } catch (error) {
      this.logger.error(`OpenAI video generation failed: ${error}`)
      throw error
    }
  }

  async getStatus(taskId: string): Promise<VideoGenerationTask> {
    const client = this.getClient()

    try {
      const response = await (client as unknown as { video: { generations: { retrieve: (id: string) => Promise<{ id: string; status: string; video_url?: string; thumbnail_url?: string; error?: { message: string } }> } } }).video.generations.retrieve(taskId)

      return {
        taskId: response.id,
        provider: 'openai',
        status: this.mapStatus(response.status),
        videoUrl: response.video_url,
        thumbnailUrl: response.thumbnail_url,
        error: response.error?.message,
      }
    } catch (error) {
      this.logger.error(`Failed to get OpenAI video status: ${error}`)
      throw error
    }
  }

  async cancel(taskId: string): Promise<void> {
    const client = this.getClient()
    await (client as unknown as { video: { generations: { cancel: (id: string) => Promise<void> } } }).video.generations.cancel(taskId)
  }

  private mapResolution(
    resolution?: '720p' | '1080p' | '4k',
    aspectRatio?: '16:9' | '9:16' | '1:1',
  ): string {
    const res = resolution ?? '1080p'
    const ratio = aspectRatio ?? '16:9'

    const sizeMap: Record<string, Record<string, string>> = {
      '720p': { '16:9': '1280x720', '9:16': '720x1280', '1:1': '720x720' },
      '1080p': { '16:9': '1920x1080', '9:16': '1080x1920', '1:1': '1080x1080' },
      '4k': { '16:9': '3840x2160', '9:16': '2160x3840', '1:1': '2160x2160' },
    }

    return sizeMap[res]?.[ratio] ?? '1920x1080'
  }

  private mapStatus(status: string): VideoGenerationTask['status'] {
    switch (status) {
      case 'completed':
        return 'completed'
      case 'failed':
        return 'failed'
      case 'processing':
      case 'in_progress':
        return 'processing'
      default:
        return 'pending'
    }
  }
}
