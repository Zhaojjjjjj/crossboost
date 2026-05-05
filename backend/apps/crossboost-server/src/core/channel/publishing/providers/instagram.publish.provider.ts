import { Injectable } from '@nestjs/common'
import { BasePublishProvider, PublishContent, PublishTaskResult, ValidationResult } from './base-publish.provider'

@Injectable()
export class InstagramPublishProvider extends BasePublishProvider {
  readonly platform = 'instagram'

  async validate(content: PublishContent): Promise<ValidationResult> {
    if (content.mediaUrls.length === 0) {
      return { valid: false, message: 'At least one media URL is required for Instagram' }
    }
    if (content.description.length > 2200) {
      return { valid: false, message: 'Caption must be under 2200 characters' }
    }
    return { valid: true }
  }

  async publish(accountId: string, content: PublishContent): Promise<PublishTaskResult> {
    this.logger.log(`Publishing to Instagram for account: ${accountId}`)
    // Instagram Graph API integration placeholder
    const isVideo = content.mediaUrls.some((url) => url.match(/\.(mp4|mov)$/i))
    const mediaType = isVideo ? 'REELS' : content.mediaUrls.length > 1 ? 'CAROUSEL' : 'IMAGE'

    return {
      postId: `ig_${Date.now()}`,
      permalink: `https://www.instagram.com/p/${Date.now().toString(36)}/`,
      platform: this.platform,
      publishedAt: new Date(),
      metadata: { mediaType },
    }
  }

  async getStatus(accountId: string, postId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    this.logger.log(`Getting Instagram post status: ${postId}`)
    return { status: 'published' }
  }
}
