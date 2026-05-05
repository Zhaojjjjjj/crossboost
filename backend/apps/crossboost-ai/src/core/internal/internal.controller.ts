import { Body, Controller, Get, Post } from '@nestjs/common'
import { ChatService } from '../ai/chat/chat.service'
import { ImageService } from '../ai/image/image.service'
import { VideoService } from '../ai/video/video.service'
import { AgentService, type AgentSkill } from '../agent/agent.service'
import { ContentGenService } from '../content-gen/content-gen.service'

/**
 * Internal API endpoints for crossboost-server to call.
 * These endpoints are not exposed to external clients.
 */
@Controller('internal')
export class InternalController {
  constructor(
    private readonly chatService: ChatService,
    private readonly imageService: ImageService,
    private readonly videoService: VideoService,
    private readonly agentService: AgentService,
    private readonly contentGenService: ContentGenService,
  ) {}

  /**
   * Health check endpoint for service discovery.
   */
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'crossboost-ai',
      timestamp: new Date().toISOString(),
      capabilities: {
        chat: true,
        image: true,
        video: this.videoService.getAvailableProviders().length > 0,
        agents: true,
        contentGen: true,
      },
    }
  }

  /**
   * Quick chat completion for internal service calls.
   */
  @Post('chat')
  async chat(
    @Body()
    body: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
      model?: string
      temperature?: number
      maxTokens?: number
    },
  ) {
    return this.chatService.chat(body)
  }

  /**
   * Generate a product listing via internal API.
   */
  @Post('listing')
  async generateListing(
    @Body()
    body: {
      productName: string
      productFeatures: string[]
      targetLanguage: string
      targetMarket: string
      platform: string
      tone?: string
    },
  ) {
    return this.chatService.generateListingCopy(body)
  }

  /**
   * Generate product images via internal API.
   */
  @Post('images')
  async generateImages(
    @Body()
    body: {
      productName: string
      productCategory: string
      targetMarket: string
      style?: 'lifestyle' | 'white-background' | 'studio' | 'outdoor'
    },
  ) {
    return this.imageService.generateProductImages(body)
  }

  /**
   * Submit an agent task via internal API.
   */
  @Post('agent/task')
  async createAgentTask(
    @Body()
    body: {
      skill: AgentSkill
      input: Record<string, unknown>
      userId: string
      orgId: string
    },
  ) {
    return this.agentService.createTask(body)
  }

  /**
   * Get agent task status via internal API.
   */
  @Post('agent/status')
  async getAgentTaskStatus(@Body() body: { taskId: string }) {
    return this.agentService.getTask(body.taskId)
  }

  /**
   * Run content generation pipeline via internal API.
   */
  @Post('content-gen/pipeline')
  async runContentGenPipeline(
    @Body()
    body: {
      product: {
        name: string
        description: string
        features: string[]
        category: string
        price?: number
        brand?: string
      }
      targets: Array<{ market: string; language: string; platform: string }>
      contentTypes: Array<'listing' | 'images' | 'social' | 'email' | 'ads'>
    },
  ) {
    return this.contentGenService.runPipeline(body)
  }

  /**
   * Translate content via internal API.
   */
  @Post('translate')
  async translate(
    @Body()
    body: {
      content: string
      targetLanguage: string
      context?: string
    },
  ) {
    return this.chatService.translateContent(body.content, body.targetLanguage, body.context)
  }

  /**
   * Get available video providers.
   */
  @Get('video/providers')
  getVideoProviders() {
    return this.videoService.getAvailableProviders()
  }

  /**
   * Get available agent skills.
   */
  @Get('agent/skills')
  getAgentSkills() {
    return this.agentService.listTasks({}).tasks.length // Return skill definitions instead
  }
}
