import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account } from '@crossboost/database'
import { BasePublishProvider, PublishContent, PublishTaskResult, ValidationResult } from './base-publish.provider'
import { TikTokShopService } from '../../platforms/tiktok-shop/tiktok-shop.service'

@Injectable()
export class TikTokShopPublishProvider extends BasePublishProvider {
  readonly platform = 'tiktok_shop'

  constructor(
    private readonly tiktokService: TikTokShopService,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {
    super()
  }

  async validate(content: PublishContent): Promise<ValidationResult> {
    if (!content.title || content.title.length > 150) {
      return { valid: false, message: 'Title is required and must be under 150 characters' }
    }
    if (content.mediaUrls.length === 0) {
      return { valid: false, message: 'At least one media URL is required' }
    }
    if (content.description.length > 2000) {
      return { valid: false, message: 'Description must be under 2000 characters' }
    }
    return { valid: true }
  }

  async publish(accountId: string, content: PublishContent): Promise<PublishTaskResult> {
    this.logger.log(`Publishing to TikTok Shop for account: ${accountId}`)

    const accessToken = await this.tiktokService.getValidAccessToken(accountId)

    const isVideo = content.mediaUrls.some((url) => url.match(/\.(mp4|mov)$/i))

    if (isVideo) {
      const result = await this.tiktokService.publishContent(accessToken, {
        title: content.title,
        description: this.generatePostMessage(content.description, content.tags),
        videoUrl: content.mediaUrls[0],
        productIds: content.productIds,
      })

      return {
        postId: result.postId,
        permalink: result.permalink,
        platform: this.platform,
        publishedAt: new Date(),
        metadata: { mediaType: 'video' },
      }
    }

    const result = await this.tiktokService.publishContent(accessToken, {
      title: content.title,
      description: this.generatePostMessage(content.description, content.tags),
      images: content.mediaUrls,
      productIds: content.productIds,
    })

    return {
      postId: result.postId,
      permalink: result.permalink,
      platform: this.platform,
      publishedAt: new Date(),
      metadata: { mediaType: 'image' },
    }
  }

  async getStatus(accountId: string, postId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    this.logger.log(`Getting TikTok Shop post status: ${postId}`)
    try {
      const accessToken = await this.tiktokService.getValidAccessToken(accountId)
      const videos = await this.tiktokService.getVideoList(accessToken, 50)
      const video = videos.find((v: Record<string, unknown>) => v.id === postId)

      if (video) {
        return {
          status: 'published',
          details: {
            viewCount: video.view_count || 0,
            likeCount: video.like_count || 0,
            commentCount: video.comment_count || 0,
          },
        }
      }
      return { status: 'unknown' }
    } catch (error) {
      this.logger.error(`Failed to get TikTok post status: ${error}`)
      return { status: 'error', details: { error: String(error) } }
    }
  }
}
