import { Module, Global } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { QueueService } from './queue.service'
import { QueueName } from './enums/queue-name.enum'

export interface QueueConfig {
  connection: {
    host: string
    port: number
    password?: string
  }
  queues?: QueueName[]
}

@Global()
@Module({})
export class QueueModule {
  static forRoot(config: QueueConfig) {
    const queues = config.queues || Object.values(QueueName)
    return {
      module: QueueModule,
      imports: [
        BullModule.forRoot({
          connection: config.connection,
        }),
        ...queues.map((name) =>
          BullModule.registerQueue({
            name,
          }),
        ),
      ],
      providers: [QueueService],
      exports: [QueueService, BullModule],
    }
  }
}
