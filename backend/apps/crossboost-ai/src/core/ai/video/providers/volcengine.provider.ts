import { Injectable, Logger } from '@nestjs/common'
import { config } from '../../../../config'
import type { GenerateVideoOptions, VideoGenerationTask } from '../video.service'

@Injectable()
export class VolcengineVideoProvider {
  private readonly logger = new Logger(VolcengineVideoProvider.name)

  async generate(options: GenerateVideoOptions): Promise<VideoGenerationTask> {
    this.logger.log('Generating video with Volcengine Jimeng')

    if (!config.VOLCENGINE_ACCESS_KEY || !config.VOLCENGINE_SECRET_KEY) {
      throw new Error('VOLCENGINE_ACCESS_KEY and VOLCENGINE_SECRET_KEY are not configured')
    }

    try {
      // Volcengine Jimeng video generation API
      const endpoint = 'https://visual.volcengineapi.com'
      const action = 'CVSync2AsyncSubmitTask'

      const body = {
        req_key: 'jimeng_video_generation',
        prompt: options.prompt,
        duration: options.duration ?? 15,
        width: this.getResolution(options.resolution, options.aspectRatio).width,
        height: this.getResolution(options.resolution, options.aspectRatio).height,
        image_url: options.referenceImageUrl,
      }

      const response = await fetch(`${endpoint}/?Action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Date': new Date().toISOString(),
          Authorization: this.buildAuthHeader(action),
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Volcengine API error: ${error}`)
      }

      const result = (await response.json()) as {
        code: number
        data?: { task_id: string }
        message?: string
      }

      if (result.code !== 10000 || !result.data?.task_id) {
        throw new Error(`Volcengine error: ${result.message}`)
      }

      return {
        taskId: result.data.task_id,
        provider: 'volcengine',
        status: 'processing',
      }
    } catch (error) {
      this.logger.error(`Volcengine video generation failed: ${error}`)
      throw error
    }
  }

  async getStatus(taskId: string): Promise<VideoGenerationTask> {
    if (!config.VOLCENGINE_ACCESS_KEY || !config.VOLCENGINE_SECRET_KEY) {
      throw new Error('Volcengine credentials are not configured')
    }

    try {
      const endpoint = 'https://visual.volcengineapi.com'
      const action = 'CVSync2AsyncGetResult'

      const response = await fetch(
        `${endpoint}/?Action=${action}&task_id=${taskId}`,
        {
          headers: {
            'X-Date': new Date().toISOString(),
            Authorization: this.buildAuthHeader(action),
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`)
      }

      const result = (await response.json()) as {
        code: number
        data?: {
          status: number
          video_url?: string
          thumbnail_url?: string
          error_message?: string
        }
      }

      return {
        taskId,
        provider: 'volcengine',
        status: this.mapStatus(result.data?.status),
        videoUrl: result.data?.video_url,
        thumbnailUrl: result.data?.thumbnail_url,
        error: result.data?.error_message,
      }
    } catch (error) {
      this.logger.error(`Failed to get Volcengine video status: ${error}`)
      throw error
    }
  }

  async cancel(_taskId: string): Promise<void> {
    this.logger.warn('Volcengine video cancellation not supported')
  }

  private getResolution(
    resolution?: '720p' | '1080p' | '4k',
    aspectRatio?: '16:9' | '9:16' | '1:1',
  ): { width: number; height: number } {
    const res = resolution ?? '1080p'
    const ratio = aspectRatio ?? '16:9'

    const base = res === '720p' ? 720 : res === '4k' ? 2160 : 1080

    if (ratio === '9:16') return { width: base, height: Math.round(base * 16 / 9) }
    if (ratio === '1:1') return { width: base, height: base }
    return { width: Math.round(base * 16 / 9), height: base }
  }

  private buildAuthHeader(action: string): string {
    // Simplified HMAC auth for Volcengine
    // In production, use proper Volcengine SDK signing
    return `HMAC-SHA256 Credential=${config.VOLCENGINE_ACCESS_KEY}, Action=${action}`
  }

  private mapStatus(status?: number): VideoGenerationTask['status'] {
    switch (status) {
      case 1:
        return 'pending'
      case 2:
        return 'processing'
      case 3:
        return 'completed'
      case 4:
        return 'failed'
      default:
        return 'pending'
    }
  }
}
