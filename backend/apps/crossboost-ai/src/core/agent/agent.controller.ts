import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import {
  AgentService,
  type AgentSkill,
  type AgentStatus,
  type CreateAgentTaskOptions,
} from './agent.service'

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('tasks')
  async createTask(
    @Body()
    body: {
      skill: AgentSkill
      input: Record<string, unknown>
      userId: string
      orgId: string
      callbackUrl?: string
      priority?: number
    },
  ) {
    return this.agentService.createTask(body as CreateAgentTaskOptions)
  }

  @Get('tasks/:taskId')
  async getTask(@Param('taskId') taskId: string) {
    return this.agentService.getTask(taskId)
  }

  @Get('tasks')
  async listTasks(
    @Query('userId') userId?: string,
    @Query('orgId') orgId?: string,
    @Query('status') status?: AgentStatus,
    @Query('skill') skill?: AgentSkill,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.agentService.listTasks({
      userId,
      orgId,
      status,
      skill,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    })
  }

  @Post('tasks/:taskId/cancel')
  async cancelTask(@Param('taskId') taskId: string) {
    return this.agentService.cancelTask(taskId)
  }

  /**
   * SSE endpoint for streaming agent task progress in real-time.
   */
  @Sse('tasks/:taskId/stream')
  streamTask(@Param('taskId') taskId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const stream = this.agentService.streamTask(taskId)

      const iterate = async () => {
        for await (const event of stream) {
          subscriber.next({
            data: event,
            type: event.type,
            id: `${event.taskId}-${Date.now()}`,
          })
        }
        subscriber.complete()
      }

      iterate().catch((error) => {
        subscriber.error(error)
      })
    })
  }
}
