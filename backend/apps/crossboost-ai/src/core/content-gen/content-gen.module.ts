import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContentTask } from '@crossboost/database'
import { ContentGenService } from './content-gen.service'
import { ContentGenController } from './content-gen.controller'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [TypeOrmModule.forFeature([ContentTask]), AiModule],
  controllers: [ContentGenController],
  providers: [ContentGenService],
  exports: [ContentGenService],
})
export class ContentGenModule {}
