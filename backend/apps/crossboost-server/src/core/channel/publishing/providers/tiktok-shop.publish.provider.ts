import { Injectable } from '@nestjs/common'
import { BasePublishProvider, PublishContent, PublishTaskResult, ValidationResult } from './base-publish.provider'

@Injectable()
export class TikTokShopPublishProvider extends BasePublishProvider {
  readonly platform = 'tiktok_shop'

  async validate(content: PublishContent): Promise<ValidationResult> {
    if (!content.title || content.title.length > 150) {
      return { valid: false, message: 'Title is required and must be under 150 characters' }
    }
    if (content.mediaUrls.length === 0) {
      return { valid: false, message: 'At least one media URL is required' }
    }
    return { valid: true }
  }

  async publish(accountId: string, content: PublishContent): Promise<PublishTaskResult> {
    this.logger.log(`Publishing to TikTok Shop for account: ${accountId}`)
    // TikTok Shop API integration placeholder
    return {
      postId: `tt_${Date.now()}`,
      permalink: `https://www.tiktok.com/@user/video/${Date.now()}`,
      platform: this.platform,
      publishedAt: new Date(),
    }
  }

  async getStatus(accountId: string, postId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    this.logger.log(`Getting TikTok Shop post status: ${postId}`)
    return { status: 'published' }
  }
}
