import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { DataCubeModule } from './data-cube/data-cube.module'
import { InstagramService } from './platforms/instagram/instagram.service'
import { PinterestService } from './platforms/pinterest/pinterest.service'
import { TikTokShopService } from './platforms/tiktok-shop/tiktok-shop.service'
import { YoutubeService } from './platforms/youtube/youtube.service'
import { PublishingModule } from './publishing/publishing.module'

@Module({
  imports: [AccountModule, PublishingModule, DataCubeModule],
  providers: [TikTokShopService, InstagramService, PinterestService, YoutubeService],
  exports: [TikTokShopService, InstagramService, PinterestService, YoutubeService, PublishingModule, DataCubeModule],
})
export class ChannelModule {}
