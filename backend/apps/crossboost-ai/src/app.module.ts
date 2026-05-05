import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { MongodbModule } from '@crossboost/mongodb'
import { QueueModule } from '@crossboost/queue'
import { RedlockModule } from '@crossboost/redlock'
import { AuthModule } from '@crossboost/auth'
import { AssetsModule } from '@crossboost/assets'
import { AiModule } from './core/ai/ai.module'
import { AgentModule } from './core/agent/agent.module'
import { ContentGenModule } from './core/content-gen/content-gen.module'
import { InternalModule } from './core/internal/internal.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongodbModule,
    QueueModule,
    RedlockModule,
    AuthModule,
    AssetsModule,
    AiModule,
    AgentModule,
    ContentGenModule,
    InternalModule,
  ],
})
export class AppModule {}
