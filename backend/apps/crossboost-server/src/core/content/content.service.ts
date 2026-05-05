import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@crossboost/common'

export type ContentType = 'post' | 'video' | 'image' | 'story' | 'reel'

export interface Content {
  id: string
  userId: string
  type: ContentType
  title: string
  body: string
  mediaUrls: string[]
  tags: string[]
  platform: string
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  scheduledAt?: Date
  publishedAt?: Date
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface ContentListResult {
  items: Content[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)

  async create(userId: string, data: Omit<Content, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Content> {
    const content: Content = {
      id: this.generateId(),
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.logger.log(`Content created: ${content.title} (${content.type})`)
    return content
  }

  async list(
    userId: string,
    query: { page?: number; pageSize?: number; type?: ContentType; status?: string; platform?: string },
  ): Promise<ContentListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    this.logger.log(`Listing content for user: ${userId}`)
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }

  async getById(id: string, userId: string): Promise<Content> {
    // Repository call placeholder
    throw new AppException(ResponseCode.ContentTaskNotFound, { message: 'Content not found' })
  }

  async update(id: string, userId: string, data: Partial<Content>): Promise<Content> {
    const content = await this.getById(id, userId)
    if (content.userId !== userId) {
      throw new AppException(ResponseCode.ContentTaskNotFound, { message: 'Content not found' })
    }

    const updated = {
      ...content,
      ...data,
      updatedAt: new Date(),
    }

    this.logger.log(`Content updated: ${id}`)
    return updated
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const content = await this.getById(id, userId)
    if (content.userId !== userId) {
      throw new AppException(ResponseCode.ContentTaskNotFound, { message: 'Content not found' })
    }

    this.logger.log(`Content soft-deleted: ${id}`)
  }

  async schedule(id: string, userId: string, scheduledAt: Date): Promise<Content> {
    return this.update(id, userId, { status: 'scheduled', scheduledAt })
  }

  async archive(id: string, userId: string): Promise<Content> {
    return this.update(id, userId, { status: 'archived' })
  }

  private generateId(): string {
    return `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}
