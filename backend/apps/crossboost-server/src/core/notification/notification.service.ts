import { Injectable, Logger } from '@nestjs/common'

export type NotificationType = 'publish_success' | 'publish_failed' | 'credit_low' | 'account_expired' | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, unknown>
  createdAt: Date
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  async create(data: {
    userId: string
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
  }): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      data: data.data,
      createdAt: new Date(),
    }

    this.logger.log(`Notification created: ${data.type} for user: ${data.userId}`)
    return notification
  }

  async listByUser(userId: string, query: { page?: number; pageSize?: number; unreadOnly?: boolean }): Promise<{
    items: Notification[]
    total: number
    unreadCount: number
  }> {
    this.logger.log(`Listing notifications for user: ${userId}`)
    return {
      items: [],
      total: 0,
      unreadCount: 0,
    }
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    this.logger.log(`Notification marked as read: ${id}`)
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.logger.log(`All notifications marked as read for user: ${userId}`)
  }

  async getUnreadCount(userId: string): Promise<number> {
    return 0
  }

  private generateId(): string {
    return `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}
