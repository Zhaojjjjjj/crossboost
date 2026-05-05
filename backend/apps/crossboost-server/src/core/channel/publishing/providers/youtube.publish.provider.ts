import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account } from '@crossboost/database'
import { BasePublishProvider, PublishContent, PublishTaskResult, ValidationResult } from './base-publish.provider'
import { YoutubeService } from '../../platforms/youtube/youtube.service'

@Injectable()
export class YoutubePublishProvider extends BasePublishProvider {
  readonly platform = 'youtube'

  constructor(
    private readonly youtubeService: YoutubeService,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {
    super()
  }

  async validate(content: PublishContent): Promise<ValidationResult> {
    if (!content.title || content.title.length > 100) {
      return { valid: false, message: 'Title is required and must be under 100 characters' }
    }
    const hasVideo = content.mediaUrls.some((url) => url.match(/\.(mp4|mov|avi|wmv|mkv)$/i))
    if (!hasVideo) {
      return { valid: false, message: 'A video URL is required for YouTube' }
    }
    if (content.description.length > 5000) {
      return { valid: false, message: 'Description must be under 5000 characters' }
    }
    return { valid: true }
  }

  async publish(accountId: string, content: PublishContent): Promise<PublishTaskResult> {
    this.logger.log(`Publishing video to YouTube for account: ${accountId}`)

    const accessToken = await this.youtubeService.getValidAccessToken(accountId)

    const videoUrl = content.mediaUrls.find((url) => url.match(/\.(mp4|mov|avi|wmv|mkv)$/i))!
    const thumbnailUrl = content.mediaUrls.find((url) => url.match(/\.(jpg|jpeg|png|webp)$/i))

    const video = await this.youtubeService.uploadVideo(accessToken, {
      title: content.title,
      description: this.generatePostMessage(content.description, content.tags),
      videoUrl,
      thumbnailUrl,
      tags: content.tags,
      privacyStatus: 'public',
    })

    return {
      postId: video.videoId,
      permalink: `https://www.youtube.com/watch?v=${video.videoId}`,
      platform: this.platform,
      publishedAt: new Date(),
      metadata: {
        videoId: video.videoId,
        thumbnailUrl: video.thumbnailUrl,
      },
    }
  }

  async getStatus(accountId: string, postId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    this.logger.log(`Getting YouTube video status: ${postId}`)
    try {
      const accessToken = await this.youtubeService.getValidAccessToken(accountId)
      const analytics = await this.youtubeService.getVideoAnalytics(accessToken, postId)

      return {
        status: 'published',
        details: {
          views: analytics.views,
          likes: analytics.likes,
          comments: analytics.comments,
          shares: analytics.shares,
          averageViewDuration: analytics.averageViewDuration,
          estimatedMinutesWatched: analytics.estimatedMinutesWatched,
        },
      }
    } catch (error) {
      this.logger.error(`Failed to get YouTube video status: ${error}`)
      return { status: 'error', details: { error: String(error) } }
    }
  }
}
