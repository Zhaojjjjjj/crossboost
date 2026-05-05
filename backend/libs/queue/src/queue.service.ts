import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue, JobsOptions } from 'bullmq'
import { QueueName } from './enums/queue-name.enum'

@Injectable()
export class QueueService {
  private readonly queues: Map<string, Queue> = new Map()

  constructor() {
    // Queues are injected dynamically via forRoot
  }

  /**
   * Add a job to a named queue
   */
  async addJob<T = any>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: JobsOptions,
  ) {
    const queue = this.getQueue(queueName)
    return queue.add(jobName, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 86400 }, // 24 hours
      removeOnFail: { age: 604800 }, // 7 days
      ...options,
    })
  }

  /**
   * Get a queue instance by name
   */
  private getQueue(name: string): Queue {
    // This is a placeholder - actual queue injection happens via BullModule
    // In practice, use @InjectQueue decorator in consuming services
    throw new Error(`Queue "${name}" not injected. Use @InjectQueue('${name}') in your service.`)
  }
}
