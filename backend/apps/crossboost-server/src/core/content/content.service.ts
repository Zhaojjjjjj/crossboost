import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AppException, ResponseCode } from '@crossboost/common'
import { ContentTask, ContentTaskType, ContentTaskStatus } from '@crossboost/database'

export interface ContentListResult {
  items: ContentTask[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)

  constructor(
    @InjectRepository(ContentTask)
    private readonly contentRepo: Repository<ContentTask>,
  ) {}

  async create(userId: string, data: {
    type: ContentTaskType
    platform?: string
    productId?: string
    input?: Record<string, any>
  }): Promise<ContentTask> {
    const entity = this.contentRepo.create({
      userId,
      type: data.type,
      platform: data.platform ?? null,
      productId: data.productId ?? null,
      input: data.input ?? null,
      status: ContentTaskStatus.PENDING,
    })

    const task = await this.contentRepo.save(entity)
    this.logger.log(`Content task created: ${task.id} (${task.type})`)
    return task
  }

  async list(
    userId: string,
    query: { page?: number; pageSize?: number; type?: ContentTaskType; status?: ContentTaskStatus; platform?: string },
  ): Promise<ContentListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = { userId }
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.platform) where.platform = query.platform

    const [items, total] = await this.contentRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })

    this.logger.log(`Listing content for user: ${userId}`)
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async getById(id: string, userId: string): Promise<ContentTask> {
    const task = await this.contentRepo.findOne({ where: { id, userId } })
    if (!task) {
      throw new AppException(ResponseCode.ContentTaskNotFound, { message: 'Content task not found' })
    }
    return task
  }

  async update(id: string, userId: string, data: Partial<{
    type: ContentTaskType
    platform: string
    input: Record<string, any>
    result: Record<string, any>
    status: ContentTaskStatus
    error: string
    creditsUsed: number
  }>): Promise<ContentTask> {
    const task = await this.getById(id, userId)
    await this.contentRepo.update(task.id, data)
    const updated = await this.contentRepo.findOne({ where: { id: task.id } })
    this.logger.log(`Content updated: ${id}`)
    return updated!
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const task = await this.getById(id, userId)
    await this.contentRepo.softDelete(task.id)
    this.logger.log(`Content soft-deleted: ${id}`)
  }

  async complete(id: string, userId: string, result: Record<string, any>, creditsUsed: number): Promise<ContentTask> {
    return this.update(id, userId, {
      status: ContentTaskStatus.COMPLETED,
      result,
      creditsUsed,
    })
  }

  async fail(id: string, userId: string, error: string): Promise<ContentTask> {
    return this.update(id, userId, {
      status: ContentTaskStatus.FAILED,
      error,
    })
  }
}
