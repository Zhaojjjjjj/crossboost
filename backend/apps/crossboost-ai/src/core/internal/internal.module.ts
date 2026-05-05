import { Module } from '@nestjs/common'
import { InternalController } from './internal.controller'
import { AiModule } from '../ai/ai.module'
import { AgentModule } from '../agent/agent.module'
import { ContentGenModule } from '../content-gen/content-gen.module'

@Module({
  imports: [AiModule, AgentModule, ContentGenModule],
  controllers: [InternalController],
})
export class InternalModule {}
