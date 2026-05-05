import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account, AnalyticsRecord } from '@crossboost/database'
import { TikTokDataProvider } from './providers/tiktok-data.provider'
import { InstagramDataProvider } from './providers/instagram-data.provider'
import { PinterestDataProvider } from './providers/pinterest-data.provider'
import { YoutubeDataProvider } from './providers/youtube-data.provider'
import { DataCubeService } from './data-cube.service'
import { TikTokShopService } from '../platforms/tiktok-shop/tiktok-shop.service'
import { InstagramService } from '../platforms/instagram/instagram.service'
import { PinterestService } from '../platforms/pinterest/pinterest.service'
import { YoutubeService } from '../platforms/youtube/youtube.service'

@Module({
  imports: [TypeOrmModule.forFeature([Account, AnalyticsRecord])],
  providers: [
    DataCubeService,
    TikTokShopService,
    InstagramService,
    PinterestService,
    YoutubeService,
    TikTokDataProvider,
    InstagramDataProvider,
    PinterestDataProvider,
    YoutubeDataProvider,
  ],
  exports: [DataCubeService],
})
export class DataCubeModule {}
