import { Injectable, Logger } from '@nestjs/common'
import { config } from '../../../../config'
import type { GenerateVideoOptions, VideoGenerationTask } from '../video.service'

@Injectable()
export class GrokVideoProvider {
  private readonly logger = new Logger(GrokVideoProvider.name)

  async generate(options: GenerateVideoOptions): Promise<VideoGenerationTask> {
    this.logger.log('Generating video with Grok')

    if (!config.GROK_API_KEY) {
      throw new Error('GROK_API_KEY is not configured')
    }

    try {
      const response = await fetch('https://api.x.ai/v1/video/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model: options.model ?? 'grok-video',
          prompt: options.prompt,
          duration: options.duration ?? 15,
          aspect_ratio: options.aspectRatio ?? '16:9',
          image_url: options.referenceImageUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Grok API error: ${error}`)
      }

      const result = (await response.json()) as { id: string; status: string }

      return {
        taskId: result.id,
        provider: 'grok',
        status: this.mapStatus(result.status),
      }
    } catch (error) {
      this.logger.error(`Grok video generation failed: ${error}`)
      throw error
    }
  }

  async getStatus(taskId: string): Promise<VideoGenerationTask> {
    if (!config.GROK_API_KEY) {
      throw new Error('GROK_API_KEY is not configured')
    }

    try {
      const response = await fetch(`https://api.x.ai/v1/video/generations/${taskId}`, {
        headers: {
          Authorization: `Bearer ${config.GROK_API_KEY}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`)
      }

      const result = (await response.json()) as {
        id: string
        status: string
        video_url?: string
        thumbnail_url?: string
        error?: string
      }

      return {
        taskId: result.id,
        provider: 'grok',
        status: this.mapStatus(result.status),
        videoUrl: result.video_url,
        thumbnailUrl: result.thumbnail_url,
        error: result.error,
      }
    } catch (error) {
      this.logger.error(`Failed to get Grok video status: ${error}`)
      throw error
    }
  }

  async cancel(taskId: string): Promise<void> {
    if (!config.GROK_API_KEY) {
      throw new Error('GROK_API_KEY is not configured')
    }

    await fetch(`https://api.x.ai/v1/video/generations/${taskId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.GROK_API_KEY}`,
      },
    })
  }

  private mapStatus(status: string): VideoGenerationTask['status'] {
    switch (status) {
      case 'completed':
        return 'completed'
      case 'failed':
        return 'failed'
      case 'processing':
        return 'processing'
      default:
        return 'pending'
    }
  }
}
