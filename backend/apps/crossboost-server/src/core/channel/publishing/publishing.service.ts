import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AppException, ResponseCode } from '@crossboost/common'
import { PublishRecord, PublishStatus } from '@crossboost/database'
import { BasePublishProvider, PublishTaskResult } from './providers/base-publish.provider'

export type PlatformType = 'tiktok_shop' | 'instagram' | 'pinterest' | 'youtube'

export interface PublishTaskData {
  userId: string
  accountId: string
  platform: PlatformType
  contentId?: string
  caption?: string
  media?: Record<string, any>
  scheduledAt?: Date
}

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name)

  constructor(
    @InjectRepository(PublishRecord)
    private readonly publishRepo: Repository<PublishRecord>,
    @Inject('PUBLISH_PROVIDERS')
    private readonly providers: Record<PlatformType, BasePublishProvider>,
  ) {}

  async createTask(data: PublishTaskData): Promise<PublishRecord> {
    const provider = this.providers[data.platform]
    if (!provider) {
      throw new AppException(ResponseCode.PlatformNotSupported, { message: `Platform ${data.platform} not supported` })
    }

    const entity = this.publishRepo.create({
      userId: data.userId,
      accountId: data.accountId,
      platform: data.platform,
      contentId: data.contentId ?? null,
      caption: data.caption ?? null,
      media: data.media ?? null,
      scheduledAt: data.scheduledAt ?? null,
      status: data.scheduledAt ? PublishStatus.PENDING : PublishStatus.PENDING,
    })

    const record = await this.publishRepo.save(entity)
    this.logger.log(`Publish task created: ${record.id} for ${data.platform}`)
    return record
  }

  async executeTask(recordId: string): Promise<PublishRecord> {
    const record = await this.publishRepo.findOne({ where: { id: recordId } })
    if (!record) {
      throw new AppException(ResponseCode.NotFound, { message: 'Publish record not found' })
    }

    const provider = this.providers[record.platform as PlatformType]
    if (!provider) {
      throw new AppException(ResponseCode.PlatformNotSupported)
    }

    // Update status to publishing
    await this.publishRepo.update(record.id, { status: PublishStatus.PUBLISHING })
    this.logger.log(`Executing publish task: ${record.id}`)

    try {
      const result = await provider.publish(record.accountId, {
        title: record.caption ?? '',
        description: record.caption ?? '',
        mediaUrls: record.media?.urls ?? [],
        tags: record.media?.tags ?? [],
      })

      await this.publishRepo.update(record.id, {
        status: PublishStatus.PUBLISHED,
        platformPostId: result.postId ?? null,
        platformUrl: result.url ?? null,
        publishedAt: new Date(),
      })

      const updated = await this.publishRepo.findOne({ where: { id: record.id } })
      return updated!
    }
    catch (error) {
      this.logger.error(`Publish task failed: ${record.id}`, error)
      await this.publishRepo.update(record.id, {
        status: PublishStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      const updated = await this.publishRepo.findOne({ where: { id: record.id } })
      return updated!
    }
  }

  async getTaskStatus(taskId: string): Promise<PublishRecord | null> {
    this.logger.log(`Getting task status: ${taskId}`)
    return this.publishRepo.findOne({ where: { id: taskId } })
  }

  async listTasks(userId: string, filters?: { platform?: PlatformType; status?: PublishStatus }): Promise<PublishRecord[]> {
    const where: any = { userId }
    if (filters?.platform) where.platform = filters.platform
    if (filters?.status) where.status = filters.status

    this.logger.log(`Listing tasks for user: ${userId}`)
    return this.publishRepo.find({ where, order: { createdAt: 'DESC' } })
  }
}
