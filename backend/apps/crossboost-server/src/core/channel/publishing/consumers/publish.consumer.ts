import { Injectable, Logger } from '@nestjs/common'
import { PublishingService } from '../publishing.service'

export interface PublishJobData {
  recordId: string
  userId: string
  accountId: string
  platform: string
  contentId?: string
  caption?: string
  media?: Record<string, any>
}

@Injectable()
export class PublishConsumer {
  private readonly logger = new Logger(PublishConsumer.name)

  constructor(private readonly publishingService: PublishingService) {}

  async handlePublishJob(data: PublishJobData): Promise<void> {
    this.logger.log(`Processing publish job for record: ${data.recordId}`)

    await this.publishingService.executeTask(data.recordId)
    this.logger.log(`Publish job completed for record: ${data.recordId}`)
  }
}
