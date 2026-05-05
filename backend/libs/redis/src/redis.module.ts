import { Module, Global } from '@nestjs/common'
import { RedisService } from './redis.service'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db?: number
  keyPrefix?: string
}

@Global()
@Module({})
export class RedisModule {
  static forRoot(config: RedisConfig) {
    return {
      module: RedisModule,
      providers: [
        RedisService,
        { provide: 'REDIS_CONFIG', useValue: config },
      ],
      exports: [RedisService],
    }
  }
}
