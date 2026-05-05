import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account } from '@crossboost/database'
import { BasePublishProvider, PublishContent, PublishTaskResult, ValidationResult } from './base-publish.provider'
import { PinterestService } from '../../platforms/pinterest/pinterest.service'

@Injectable()
export class PinterestPublishProvider extends BasePublishProvider {
  readonly platform = 'pinterest'

  constructor(
    private readonly pinterestService: PinterestService,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {
    super()
  }

  async validate(content: PublishContent): Promise<ValidationResult> {
    if (!content.title || content.title.length > 100) {
      return { valid: false, message: 'Title is required and must be under 100 characters' }
    }
    if (content.mediaUrls.length === 0) {
      return { valid: false, message: 'An image URL is required for Pinterest pins' }
    }
    if (content.description.length > 500) {
      return { valid: false, message: 'Description must be under 500 characters' }
    }
    return { valid: true }
  }

  async publish(accountId: string, content: PublishContent): Promise<PublishTaskResult> {
    this.logger.log(`Publishing pin to Pinterest for account: ${accountId}`)

    const accessToken = await this.pinterestService.getValidAccessToken(accountId)

    const isVideo = content.mediaUrls.some((url) => url.match(/\.(mp4|mov)$/i))

    if (!content.productIds?.length) {
      const boards = await this.pinterestService.getBoards(accessToken)
      if (boards.length === 0) {
        throw new Error('No Pinterest boards found. Please create a board first.')
      }
    }

    const boardId = content.productIds?.[0] || ''

    if (isVideo) {
      const pin = await this.pinterestService.createVideoPin(accessToken, {
        boardId,
        title: content.title,
        description: this.generatePostMessage(content.description, content.tags),
        videoUrl: content.mediaUrls[0],
        coverImageUrl: content.mediaUrls.length > 1 ? content.mediaUrls[1] : undefined,
      })

      return {
        postId: pin.pinId,
        permalink: `https://www.pinterest.com/pin/${pin.pinId}/`,
        platform: this.platform,
        publishedAt: new Date(),
        metadata: { mediaType: 'video', boardId: pin.boardId },
      }
    }

    const pin = await this.pinterestService.createPin(accessToken, {
      boardId,
      title: content.title,
      description: this.generatePostMessage(content.description, content.tags),
      imageUrl: content.mediaUrls[0],
      link: content.mediaUrls.length > 1 ? content.mediaUrls[1] : undefined,
      tags: content.tags,
    })

    return {
      postId: pin.pinId,
      permalink: `https://www.pinterest.com/pin/${pin.pinId}/`,
      platform: this.platform,
      publishedAt: new Date(),
      metadata: { mediaType: 'image', boardId: pin.boardId },
    }
  }

  async getStatus(accountId: string, postId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    this.logger.log(`Getting Pinterest pin status: ${postId}`)
    try {
      const accessToken = await this.pinterestService.getValidAccessToken(accountId)
      const analytics = await this.pinterestService.getPinAnalytics(accessToken, postId)

      return {
        status: 'published',
        details: {
          impressions: analytics.impressions,
          saves: analytics.saves,
          pinClicks: analytics.pinClicks,
          outboundClicks: analytics.outboundClicks,
          videoViews: analytics.videoViews,
        },
      }
    } catch (error) {
      this.logger.error(`Failed to get Pinterest pin status: ${error}`)
      return { status: 'error', details: { error: String(error) } }
    }
  }
}
