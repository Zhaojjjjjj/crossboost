import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AppException, ResponseCode } from '@crossboost/common'
import { AnalyticsRecord } from '@crossboost/database'
import { BaseDataProvider, DataCubeResult } from './providers/base-data.provider'
import { TikTokDataProvider } from './providers/tiktok-data.provider'
import { InstagramDataProvider } from './providers/instagram-data.provider'
import { PinterestDataProvider } from './providers/pinterest-data.provider'
import { YoutubeDataProvider } from './providers/youtube-data.provider'

export type PlatformType = 'tiktok_shop' | 'instagram' | 'pinterest' | 'youtube'

@Injectable()
export class DataCubeService {
  private readonly logger = new Logger(DataCubeService.name)
  private readonly providers: Record<string, BaseDataProvider>

  constructor(
    @InjectRepository(AnalyticsRecord)
    private readonly analyticsRepo: Repository<AnalyticsRecord>,
    private readonly tiktokProvider: TikTokDataProvider,
    private readonly instagramProvider: InstagramDataProvider,
    private readonly pinterestProvider: PinterestDataProvider,
    private readonly youtubeProvider: YoutubeDataProvider,
  ) {
    this.providers = {
      tiktok_shop: this.tiktokProvider,
      instagram: this.instagramProvider,
      pinterest: this.pinterestProvider,
      youtube: this.youtubeProvider,
    }
  }

  async getAccountDataCube(accountId: string, platform: PlatformType): Promise<DataCubeResult> {
    const provider = this.providers[platform]
    if (!provider) {
      throw new AppException(ResponseCode.PlatformNotSupported, { message: `Analytics not available for ${platform}` })
    }

    this.logger.log(`Getting data cube for account: ${accountId}, platform: ${platform}`)
    return provider.getAccountDataCube(accountId)
  }

  async getContentDataCube(accountId: string, platform: PlatformType, contentId: string): Promise<DataCubeResult> {
    const provider = this.providers[platform]
    if (!provider) {
      throw new AppException(ResponseCode.PlatformNotSupported)
    }

    this.logger.log(`Getting content data cube: ${contentId}`)
    return provider.getContentDataCube(accountId, contentId)
  }

  async getAggregatedData(userId: string, platforms?: PlatformType[]): Promise<{
    totalFollowers: number
    totalViews: number
    totalLikes: number
    totalEngagement: number
    platformBreakdown: Record<string, { followers: number; views: number; likes: number }>
  }> {
    this.logger.log(`Getting aggregated data for user: ${userId}`)

    // Query analytics records from database
    const records = await this.analyticsRepo.find({
      where: platforms ? { platform: platforms[0] } : {},
      order: { recordedAt: 'DESC' },
      take: 100,
    })

    return {
      totalFollowers: 0,
      totalViews: records.reduce((sum, r) => sum + r.views, 0),
      totalLikes: records.reduce((sum, r) => sum + r.likes, 0),
      totalEngagement: records.reduce((sum, r) => sum + r.comments + r.shares + r.saves, 0),
      platformBreakdown: {},
    }
  }
}
