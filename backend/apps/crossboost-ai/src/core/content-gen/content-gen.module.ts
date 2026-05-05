import { Module } from '@nestjs/common'
import { ContentGenService } from './content-gen.service'
import { ContentGenController } from './content-gen.controller'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [AiModule],
  controllers: [ContentGenController],
  providers: [ContentGenService],
  exports: [ContentGenService],
})
export class ContentGenModule {}
