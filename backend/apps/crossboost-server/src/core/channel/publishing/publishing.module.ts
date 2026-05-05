import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account, PublishRecord } from '@crossboost/database'
import { PublishConsumer } from './consumers/publish.consumer'
import { InstagramPublishProvider } from './providers/instagram.publish.provider'
import { PinterestPublishProvider } from './providers/pinterest.publish.provider'
import { TikTokShopPublishProvider } from './providers/tiktok-shop.publish.provider'
import { YoutubePublishProvider } from './providers/youtube.publish.provider'
import { PublishingService } from './publishing.service'
import { TikTokShopService } from '../platforms/tiktok-shop/tiktok-shop.service'
import { InstagramService } from '../platforms/instagram/instagram.service'
import { PinterestService } from '../platforms/pinterest/pinterest.service'
import { YoutubeService } from '../platforms/youtube/youtube.service'

@Module({
  imports: [TypeOrmModule.forFeature([Account, PublishRecord])],
  providers: [
    PublishingService,
    TikTokShopService,
    InstagramService,
    PinterestService,
    YoutubeService,
    TikTokShopPublishProvider,
    InstagramPublishProvider,
    PinterestPublishProvider,
    YoutubePublishProvider,
    PublishConsumer,
    {
      provide: 'PUBLISH_PROVIDERS',
      useFactory: (
        tiktok: TikTokShopPublishProvider,
        instagram: InstagramPublishProvider,
        pinterest: PinterestPublishProvider,
        youtube: YoutubePublishProvider,
      ) => ({
        tiktok_shop: tiktok,
        instagram,
        pinterest,
        youtube,
      }),
      inject: [TikTokShopPublishProvider, InstagramPublishProvider, PinterestPublishProvider, YoutubePublishProvider],
    },
  ],
  exports: [PublishingService],
})
export class PublishingModule {}
