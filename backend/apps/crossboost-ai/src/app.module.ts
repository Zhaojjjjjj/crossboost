import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from '@crossboost/database'
import { QueueModule } from '@crossboost/queue'
import { RedlockModule } from '@crossboost/redlock'
import { AuthModule } from '@crossboost/auth'
import { AssetsModule } from '@crossboost/assets'
import { config } from './config'
import { AiModule } from './core/ai/ai.module'
import { AgentModule } from './core/agent/agent.module'
import { ContentGenModule } from './core/content-gen/content-gen.module'
import { HealthModule } from './core/health/health.module'
import { InternalModule } from './core/internal/internal.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule.forRoot(config.database),
    QueueModule,
    RedlockModule,
    AuthModule,
    AssetsModule,
    AiModule,
    AgentModule,
    ContentGenModule,
    InternalModule,
    HealthModule,
  ],
})
export class AppModule {}
