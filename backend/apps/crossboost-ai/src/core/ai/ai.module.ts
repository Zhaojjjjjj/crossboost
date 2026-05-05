import { Module } from '@nestjs/common'
import { ChatService } from './chat/chat.service'
import { ImageService } from './image/image.service'
import { ImageController } from './image/image.controller'
import { VideoService } from './video/video.service'
import { VideoController } from './video/video.controller'

@Module({
  controllers: [ImageController, VideoController],
  providers: [ChatService, ImageService, VideoService],
  exports: [ChatService, ImageService, VideoService],
})
export class AiModule {}
