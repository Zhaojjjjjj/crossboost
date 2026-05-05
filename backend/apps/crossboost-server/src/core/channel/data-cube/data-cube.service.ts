import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@crossboost/common'
import { BaseDataProvider, DataCubeResult } from './providers/base-data.provider'
import { TikTokDataProvider } from './providers/tiktok-data.provider'
import { InstagramDataProvider } from './providers/instagram-data.provider'

export type PlatformType = 'tiktok_shop' | 'instagram'

@Injectable()
export class DataCubeService {
  private readonly logger = new Logger(DataCubeService.name)
  private readonly providers: Record<string, BaseDataProvider>

  constructor(
    private readonly tiktokProvider: TikTokDataProvider,
    private readonly instagramProvider: InstagramDataProvider,
  ) {
    this.providers = {
      tiktok_shop: this.tiktokProvider,
      instagram: this.instagramProvider,
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
    // Aggregate data across all connected accounts
    return {
      totalFollowers: 0,
      totalViews: 0,
      totalLikes: 0,
      totalEngagement: 0,
      platformBreakdown: {},
    }
  }
}
