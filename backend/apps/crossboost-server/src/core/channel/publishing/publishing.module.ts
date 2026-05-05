import { Module } from '@nestjs/common'
import { PublishConsumer } from './consumers/publish.consumer'
import { InstagramPublishProvider } from './providers/instagram.publish.provider'
import { PinterestPublishProvider } from './providers/pinterest.publish.provider'
import { TikTokShopPublishProvider } from './providers/tiktok-shop.publish.provider'
import { YoutubePublishProvider } from './providers/youtube.publish.provider'
import { PublishingService } from './publishing.service'

@Module({
  providers: [
    PublishingService,
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
