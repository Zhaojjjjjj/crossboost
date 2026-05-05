import { Module, Global } from '@nestjs/common'
import { RedlockService } from './redlock.service'

export interface RedlockConfig {
  connection: {
    host: string
    port: number
    password?: string
  }
  driftFactor?: number
  retryCount?: number
  retryDelay?: number
}

@Global()
@Module({})
export class RedlockModule {
  static forRoot(config: RedlockConfig) {
    return {
      module: RedlockModule,
      providers: [
        RedlockService,
        { provide: 'REDLOCK_CONFIG', useValue: config },
      ],
      exports: [RedlockService],
    }
  }
}
