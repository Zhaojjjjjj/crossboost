import { Injectable, Logger } from '@nestjs/common'

export interface PublishContent {
  title: string
  description: string
  mediaUrls: string[]
  tags: string[]
  productIds?: string[]
}

export interface PublishTaskResult {
  postId: string
  permalink: string
  platform: string
  publishedAt: Date
  metadata?: Record<string, unknown>
}

export interface ValidationResult {
  valid: boolean
  message?: string
}

@Injectable()
export abstract class BasePublishProvider {
  protected readonly logger = new Logger(this.constructor.name)

  abstract readonly platform: string

  abstract validate(content: PublishContent): Promise<ValidationResult>

  abstract publish(accountId: string, content: PublishContent): Promise<PublishTaskResult>

  abstract getStatus(accountId: string, postId: string): Promise<{ status: string; details?: Record<string, unknown> }>

  protected generatePostMessage(description: string, tags: string[]): string {
    if (tags.length > 0) {
      const tagString = tags.map((t) => `#${t}`).join(' ')
      return `${description} ${tagString}`
    }
    return description
  }
}
