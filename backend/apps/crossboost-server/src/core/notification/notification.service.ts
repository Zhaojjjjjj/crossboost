import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification, NotificationType } from '@crossboost/database'

export interface NotificationListResult {
  items: Notification[]
  total: number
  unreadCount: number
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(data: {
    userId: string
    type: NotificationType
    title: string
    message: string
  }): Promise<Notification> {
    const entity = this.notificationRepo.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false,
    })

    const notification = await this.notificationRepo.save(entity)
    this.logger.log(`Notification created: ${data.type} for user: ${data.userId}`)
    return notification
  }

  async listByUser(userId: string, query: { page?: number; pageSize?: number; unreadOnly?: boolean }): Promise<NotificationListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = { userId }
    if (query.unreadOnly) {
      where.isRead = false
    }

    const [items, total] = await this.notificationRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })

    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    })

    this.logger.log(`Listing notifications for user: ${userId}`)
    return {
      items,
      total,
      unreadCount,
    }
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationRepo.update({ id, userId }, { isRead: true })
    this.logger.log(`Notification marked as read: ${id}`)
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true })
    this.logger.log(`All notifications marked as read for user: ${userId}`)
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({ where: { userId, isRead: false } })
  }
}
