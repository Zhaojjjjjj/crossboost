import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import {
  VideoService,
  type GenerateVideoOptions,
  type ProductVideoContext,
  type VideoProvider,
} from './video.service'

@Controller('ai/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate')
  async generateVideo(@Body() body: GenerateVideoOptions) {
    return this.videoService.generateVideo(body)
  }

  @Post('product')
  async generateProductVideo(@Body() body: ProductVideoContext) {
    return this.videoService.generateProductVideo(body)
  }

  @Get('status/:provider/:taskId')
  async getStatus(@Param('provider') provider: VideoProvider, @Param('taskId') taskId: string) {
    return this.videoService.getTaskStatus(taskId, provider)
  }

  @Post('cancel/:provider/:taskId')
  async cancelTask(@Param('provider') provider: VideoProvider, @Param('taskId') taskId: string) {
    return this.videoService.cancelTask(taskId, provider)
  }

  @Get('providers')
  getAvailableProviders() {
    return this.videoService.getAvailableProviders()
  }
}
