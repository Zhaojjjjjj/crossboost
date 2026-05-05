import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account } from '@crossboost/database'
import { BasePublishProvider, PublishContent, PublishTaskResult, ValidationResult } from './base-publish.provider'
import { InstagramService } from '../../platforms/instagram/instagram.service'

@Injectable()
export class InstagramPublishProvider extends BasePublishProvider {
  readonly platform = 'instagram'

  constructor(
    private readonly instagramService: InstagramService,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {
    super()
  }

  async validate(content: PublishContent): Promise<ValidationResult> {
    if (content.mediaUrls.length === 0) {
      return { valid: false, message: 'At least one media URL is required for Instagram' }
    }
    if (content.description.length > 2200) {
      return { valid: false, message: 'Caption must be under 2200 characters' }
    }
    if (content.mediaUrls.length > 10) {
      return { valid: false, message: 'Carousel posts support a maximum of 10 items' }
    }
    return { valid: true }
  }

  async publish(accountId: string, content: PublishContent): Promise<PublishTaskResult> {
    this.logger.log(`Publishing to Instagram for account: ${accountId}`)

    const accessToken = await this.instagramService.getValidAccessToken(accountId)
    const caption = this.generatePostMessage(content.description, content.tags)

    const isVideo = content.mediaUrls.some((url) => url.match(/\.(mp4|mov)$/i))

    if (isVideo) {
      const result = await this.instagramService.publishVideo(accessToken, {
        videoUrl: content.mediaUrls[0],
        caption,
      })

      return {
        postId: result.mediaId,
        permalink: result.permalink,
        platform: this.platform,
        publishedAt: new Date(),
        metadata: { mediaType: 'REELS' },
      }
    }

    if (content.mediaUrls.length > 1) {
      const result = await this.instagramService.publishCarousel(accessToken, {
        items: content.mediaUrls.map((url) => ({ imageUrl: url })),
        caption,
      })

      return {
        postId: result.mediaId,
        permalink: result.permalink,
        platform: this.platform,
        publishedAt: new Date(),
        metadata: { mediaType: 'CAROUSEL' },
      }
    }

    const result = await this.instagramService.publishImage(accessToken, {
      imageUrl: content.mediaUrls[0],
      caption,
      tags: content.tags,
    })

    return {
      postId: result.mediaId,
      permalink: result.permalink,
      platform: this.platform,
      publishedAt: new Date(),
      metadata: { mediaType: 'IMAGE' },
    }
  }

  async getStatus(accountId: string, postId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    this.logger.log(`Getting Instagram post status: ${postId}`)
    try {
      const accessToken = await this.instagramService.getValidAccessToken(accountId)
      const insights = await this.instagramService.getMediaInsights(accessToken, postId)

      return {
        status: 'published',
        details: {
          impressions: insights.impressions,
          reach: insights.reach,
          engagement: insights.engagement,
          saved: insights.saved,
          videoViews: insights.videoViews,
        },
      }
    } catch (error) {
      this.logger.error(`Failed to get Instagram post status: ${error}`)
      return { status: 'error', details: { error: String(error) } }
    }
  }
}
