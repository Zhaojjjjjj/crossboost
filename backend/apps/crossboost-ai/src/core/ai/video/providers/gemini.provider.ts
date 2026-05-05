import { Injectable, Logger } from '@nestjs/common'
import { config } from '../../../../config'
import type { GenerateVideoOptions, VideoGenerationTask } from '../video.service'

@Injectable()
export class GeminiVideoProvider {
  private readonly logger = new Logger(GeminiVideoProvider.name)

  async generate(options: GenerateVideoOptions): Promise<VideoGenerationTask> {
    this.logger.log('Generating video with Google Gemini Veo')

    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    try {
      const model = options.model ?? 'veo-2'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`

      const body: Record<string, unknown> = {
        contents: [
          {
            parts: [
              {
                text: options.prompt,
              },
            ],
          },
        ],
        generationConfig: {
          durationSeconds: options.duration ?? 15,
          aspectRatio: options.aspectRatio === '9:16' ? 'PORTRAIT' : options.aspectRatio === '1:1' ? 'SQUARE' : 'LANDSCAPE',
        },
      }

      if (options.referenceImageUrl) {
        ;(body.contents as Array<{ parts: Array<Record<string, unknown>> }>)[0].parts.push({
          fileData: {
            mimeType: 'image/png',
            fileUri: options.referenceImageUrl,
          },
        })
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Gemini API error: ${error}`)
      }

      const result = (await response.json()) as { name?: string }

      return {
        taskId: result.name ?? `gemini-${Date.now()}`,
        provider: 'gemini',
        status: 'processing',
      }
    } catch (error) {
      this.logger.error(`Gemini video generation failed: ${error}`)
      throw error
    }
  }

  async getStatus(taskId: string): Promise<VideoGenerationTask> {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${taskId}?key=${config.GEMINI_API_KEY}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`)
      }

      const result = (await response.json()) as {
        done?: boolean
        response?: { generateContentResponse?: { candidates?: Array<{ content?: { parts?: Array<{ fileData?: { fileUri: string }> } }> }> } }
        error?: { message: string }
      }

      const videoPart = result.response?.generateContentResponse?.candidates?.[0]?.content?.parts?.find(
        (p) => p.fileData?.fileUri,
      )

      return {
        taskId,
        provider: 'gemini',
        status: result.done ? 'completed' : result.error ? 'failed' : 'processing',
        videoUrl: videoPart?.fileData?.fileUri,
        error: result.error?.message,
      }
    } catch (error) {
      this.logger.error(`Failed to get Gemini video status: ${error}`)
      throw error
    }
  }

  async cancel(_taskId: string): Promise<void> {
    this.logger.warn('Gemini video cancellation not supported by API')
  }
}
