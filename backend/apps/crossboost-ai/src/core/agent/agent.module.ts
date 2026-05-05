import { Module } from '@nestjs/common'
import { AgentService } from './agent.service'
import { AgentController } from './agent.controller'
import { AgentRuntimeService } from './services/agent-runtime.service'
import { AiModule } from '../ai/ai.module'
import { ContentGenModule } from '../content-gen/content-gen.module'

@Module({
  imports: [AiModule, ContentGenModule],
  controllers: [AgentController],
  providers: [AgentService, AgentRuntimeService],
  exports: [AgentService],
})
export class AgentModule {}
