import { Injectable, Logger } from '@nestjs/common'
import { PublishingService, PublishTask } from '../publishing.service'

export interface PublishJobData {
  taskId: string
  userId: string
  accountId: string
  platform: string
  content: PublishTask['content']
}

@Injectable()
export class PublishConsumer {
  private readonly logger = new Logger(PublishConsumer.name)

  constructor(private readonly publishingService: PublishingService) {}

  async handlePublishJob(data: PublishJobData): Promise<void> {
    this.logger.log(`Processing publish job for task: ${data.taskId}`)

    const task: PublishTask = {
      id: data.taskId,
      userId: data.userId,
      accountId: data.accountId,
      platform: data.platform as PublishTask['platform'],
      content: data.content,
      status: 'publishing',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await this.publishingService.executeTask(task)
    this.logger.log(`Publish job completed for task: ${data.taskId}`)
  }
}
