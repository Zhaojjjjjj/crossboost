import { Module } from '@nestjs/common'
import { TikTokDataProvider } from './providers/tiktok-data.provider'
import { InstagramDataProvider } from './providers/instagram-data.provider'
import { DataCubeService } from './data-cube.service'

@Module({
  providers: [DataCubeService, TikTokDataProvider, InstagramDataProvider],
  exports: [DataCubeService],
})
export class DataCubeModule {}
