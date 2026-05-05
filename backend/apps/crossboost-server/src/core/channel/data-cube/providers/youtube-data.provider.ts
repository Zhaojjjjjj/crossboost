import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account, PlatformType } from '@crossboost/database'
import { BaseDataProvider, DataCubeResult } from './base-data.provider'
import { YoutubeService } from '../../platforms/youtube/youtube.service'

@Injectable()
export class YoutubeDataProvider extends BaseDataProvider {
  readonly platform = 'youtube'

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly youtubeService: YoutubeService,
  ) {
    super()
  }

  async getAccountDataCube(accountId: string): Promise<DataCubeResult> {
    this.logger.log(`Getting YouTube data cube for account: ${accountId}`)

    const account = await this.accountRepo.findOne({ where: { id: accountId } })
    if (!account?.accessToken) {
      throw new Error('YouTube account not connected')
    }

    const accessToken = await this.youtubeService.getValidAccessToken(accountId)

    const channelInfo = await this.youtubeService.getChannelInfo(accessToken)

    const channelAnalytics = await this.youtubeService.getChannelAnalytics(accessToken)

    const videos = await this.youtubeService.getVideoList(accessToken, 50)

    const videoAnalyticsResults = await Promise.allSettled(
      videos.slice(0, 20).map((video) =>
        this.youtubeService.getVideoAnalytics(accessToken, video.videoId),
      ),
    )

    const totalViews = videoAnalyticsResults.reduce((sum, result) => {
      if (result.status === 'fulfilled') return sum + result.value.views
      return sum
    }, 0)

    const totalLikes = videoAnalyticsResults.reduce((sum, result) => {
      if (result.status === 'fulfilled') return sum + result.value.likes
      return sum
    }, 0)

    const totalComments = videoAnalyticsResults.reduce((sum, result) => {
      if (result.status === 'fulfilled') return sum + result.value.comments
      return sum
    }, 0)

    const totalShares = videoAnalyticsResults.reduce((sum, result) => {
      if (result.status === 'fulfilled') return sum + result.value.shares
      return sum
    }, 0)

    const engagementRate = totalViews > 0
      ? ((totalLikes + totalComments + totalShares) / totalViews) * 100
      : 0

    const topContent = videos
      .map((video, index) => {
        const result = videoAnalyticsResults[index]
        const analytics = result?.status === 'fulfilled' ? result.value : null
        return {
          contentId: video.videoId,
          title: video.title,
          views: analytics?.views || video.viewCount,
          likes: analytics?.likes || video.likeCount,
          engagementRate: (analytics?.views || video.viewCount) > 0
            ? (((analytics?.likes || video.likeCount) + (analytics?.comments || 0)) /
              (analytics?.views || video.viewCount)) * 100
            : 0,
        }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    const timeSeries = this.buildTimeSeries(videos)

    return {
      accountId,
      platform: this.platform,
      metrics: {
        followers: channelInfo.subscriberCount || account.followers || 0,
        views: channelAnalytics.totalViews || totalViews,
        likes: channelAnalytics.totalLikes || totalLikes,
        comments: channelAnalytics.totalComments || totalComments,
        shares: totalShares,
        engagementRate,
      },
      timeSeries,
      topContent,
    }
  }

  async getContentDataCube(accountId: string, contentId: string): Promise<DataCubeResult> {
    this.logger.log(`Getting YouTube content data cube: ${contentId}`)

    const accessToken = await this.youtubeService.getValidAccessToken(accountId)
    const analytics = await this.youtubeService.getVideoAnalytics(accessToken, contentId)

    const engagementRate = analytics.views > 0
      ? ((analytics.likes + analytics.comments + analytics.shares) / analytics.views) * 100
      : 0

    return {
      accountId,
      platform: this.platform,
      metrics: {
        followers: 0,
        views: analytics.views,
        likes: analytics.likes,
        comments: analytics.comments,
        shares: analytics.shares,
        engagementRate,
      },
    }
  }

  async getAccountGrowth(accountId: string, days: number): Promise<{
    followersGrowth: number
    viewsGrowth: number
    engagementGrowth: number
  }> {
    this.logger.log(`Getting YouTube growth for ${days} days`)

    try {
      const accessToken = await this.youtubeService.getValidAccessToken(accountId)
      const channelAnalytics = await this.youtubeService.getChannelAnalytics(accessToken)

      return {
        followersGrowth: channelAnalytics.subscriberCount,
        viewsGrowth: channelAnalytics.totalViews,
        engagementGrowth: channelAnalytics.estimatedMinutesWatched,
      }
    } catch {
      return { followersGrowth: 0, viewsGrowth: 0, engagementGrowth: 0 }
    }
  }

  private buildTimeSeries(
    videos: Array<{ publishedAt: string; viewCount: number; likeCount: number }>,
  ): Array<{ date: string; views: number; likes: number; comments: number }> {
    const dailyMap = new Map<string, { views: number; likes: number; comments: number }>()

    for (const video of videos) {
      const date = video.publishedAt?.split('T')[0]
      if (!date) continue

      const existing = dailyMap.get(date) || { views: 0, likes: 0, comments: 0 }
      existing.views += video.viewCount
      existing.likes += video.likeCount
      dailyMap.set(date, existing)
    }

    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({ date, ...metrics }))
  }
}
