import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContentTask } from '@crossboost/database'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'

@Module({
  imports: [TypeOrmModule.forFeature([ContentTask])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
