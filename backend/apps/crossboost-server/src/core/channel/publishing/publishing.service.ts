import { Inject, Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@crossboost/common'
import { BasePublishProvider, PublishTaskResult } from './providers/base-publish.provider'

export type PlatformType = 'tiktok_shop' | 'instagram' | 'pinterest' | 'youtube'

export interface PublishTask {
  id: string
  userId: string
  accountId: string
  platform: PlatformType
  content: {
    title: string
    description: string
    mediaUrls: string[]
    tags: string[]
    productIds?: string[]
  }
  scheduledAt?: Date
  status: 'pending' | 'queued' | 'publishing' | 'published' | 'failed'
  result?: PublishTaskResult
  error?: string
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name)

  constructor(
    @Inject('PUBLISH_PROVIDERS')
    private readonly providers: Record<PlatformType, BasePublishProvider>,
  ) {}

  async createTask(data: {
    userId: string
    accountId: string
    platform: PlatformType
    content: PublishTask['content']
    scheduledAt?: Date
  }): Promise<PublishTask> {
    const provider = this.providers[data.platform]
    if (!provider) {
      throw new AppException(ResponseCode.PlatformNotSupported, { message: `Platform ${data.platform} not supported` })
    }

    const validation = await provider.validate(data.content)
    if (!validation.valid) {
      throw new AppException(ResponseCode.InvalidParam, { message: validation.message })
    }

    const task: PublishTask = {
      id: this.generateId(),
      userId: data.userId,
      accountId: data.accountId,
      platform: data.platform,
      content: data.content,
      scheduledAt: data.scheduledAt,
      status: data.scheduledAt ? 'queued' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.logger.log(`Publish task created: ${task.id} for ${data.platform}`)
    return task
  }

  async executeTask(task: PublishTask): Promise<PublishTask> {
    const provider = this.providers[task.platform]
    if (!provider) {
      throw new AppException(ResponseCode.PlatformNotSupported)
    }

    this.logger.log(`Executing publish task: ${task.id}`)

    try {
      const result = await provider.publish(task.accountId, task.content)
      return {
        ...task,
        status: 'published',
        result,
        updatedAt: new Date(),
      }
    }
    catch (error) {
      this.logger.error(`Publish task failed: ${task.id}`, error)
      return {
        ...task,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      }
    }
  }

  async getTaskStatus(taskId: string): Promise<PublishTask | null> {
    this.logger.log(`Getting task status: ${taskId}`)
    // Repository call placeholder
    return null
  }

  async listTasks(userId: string, filters?: { platform?: PlatformType; status?: string }): Promise<PublishTask[]> {
    this.logger.log(`Listing tasks for user: ${userId}`)
    return []
  }

  private generateId(): string {
    return `pub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}
