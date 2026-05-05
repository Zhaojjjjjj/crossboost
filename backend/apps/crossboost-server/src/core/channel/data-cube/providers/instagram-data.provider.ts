import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account, PlatformType } from '@crossboost/database'
import { BaseDataProvider, DataCubeResult } from './base-data.provider'
import { InstagramService } from '../../platforms/instagram/instagram.service'

@Injectable()
export class InstagramDataProvider extends BaseDataProvider {
  readonly platform = 'instagram'

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly instagramService: InstagramService,
  ) {
    super()
  }

  async getAccountDataCube(accountId: string): Promise<DataCubeResult> {
    this.logger.log(`Getting Instagram data cube for account: ${accountId}`)

    const account = await this.accountRepo.findOne({ where: { id: accountId } })
    if (!account?.accessToken) {
      throw new Error('Instagram account not connected')
    }

    const accessToken = await this.instagramService.getValidAccessToken(accountId)
    const igAccount = await this.instagramService.getInstagramBusinessAccount(accessToken)

    const accountInsights = await this.instagramService.getAccountInsights(accessToken, igAccount.id, 'day')

    const mediaList = await this.instagramService.getMediaList(accessToken, igAccount.id, 50)

    const totalLikes = mediaList.reduce((sum, m) => sum + m.likeCount, 0)
    const totalComments = mediaList.reduce((sum, m) => sum + m.commentsCount, 0)
    const totalEngagement = totalLikes + totalComments
    const engagementRate = accountInsights.reach > 0
      ? (totalEngagement / accountInsights.reach) * 100
      : 0

    const topContent = await Promise.all(
      mediaList
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 10)
        .map(async (media) => {
          try {
            const insights = await this.instagramService.getMediaInsights(accessToken, media.id)
            return {
              contentId: media.id,
              title: media.caption?.substring(0, 100) || 'No caption',
              views: insights.impressions,
              likes: media.likeCount,
              engagementRate: insights.impressions > 0
                ? ((media.likeCount + media.commentsCount) / insights.impressions) * 100
                : 0,
            }
          } catch {
            return {
              contentId: media.id,
              title: media.caption?.substring(0, 100) || 'No caption',
              views: 0,
              likes: media.likeCount,
              engagementRate: 0,
            }
          }
        }),
    )

    const timeSeries = this.buildTimeSeries(mediaList)

    return {
      accountId,
      platform: this.platform,
      metrics: {
        followers: igAccount.followers_count || account.followers || 0,
        views: accountInsights.impressions,
        likes: totalLikes,
        comments: totalComments,
        shares: 0,
        engagementRate,
      },
      timeSeries,
      topContent,
    }
  }

  async getContentDataCube(accountId: string, contentId: string): Promise<DataCubeResult> {
    this.logger.log(`Getting Instagram content data cube: ${contentId}`)

    const accessToken = await this.instagramService.getValidAccessToken(accountId)
    const insights = await this.instagramService.getMediaInsights(accessToken, contentId)

    return {
      accountId,
      platform: this.platform,
      metrics: {
        followers: 0,
        views: insights.impressions,
        likes: 0,
        comments: 0,
        shares: 0,
        engagementRate: insights.reach > 0 ? (insights.engagement / insights.reach) * 100 : 0,
      },
    }
  }

  async getAccountGrowth(accountId: string, days: number): Promise<{
    followersGrowth: number
    viewsGrowth: number
    engagementGrowth: number
  }> {
    this.logger.log(`Getting Instagram growth for ${days} days`)

    try {
      const accessToken = await this.instagramService.getValidAccessToken(accountId)
      const igAccount = await this.instagramService.getInstagramBusinessAccount(accessToken)

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const sinceTimestamp = Math.floor(since.getTime() / 1000).toString()
      const untilTimestamp = Math.floor(Date.now() / 1000).toString()

      const insights = await this.instagramService.getAccountInsights(
        accessToken,
        igAccount.id,
        'day',
        sinceTimestamp,
        untilTimestamp,
      )

      return {
        followersGrowth: insights.followerCount,
        viewsGrowth: insights.impressions,
        engagementGrowth: insights.profileViews,
      }
    } catch {
      return { followersGrowth: 0, viewsGrowth: 0, engagementGrowth: 0 }
    }
  }

  private buildTimeSeries(
    mediaList: Array<{ timestamp: string; likeCount: number; commentsCount: number }>,
  ): Array<{ date: string; views: number; likes: number; comments: number }> {
    const dailyMap = new Map<string, { views: number; likes: number; comments: number }>()

    for (const media of mediaList) {
      const date = media.timestamp.split('T')[0]
      const existing = dailyMap.get(date) || { views: 0, likes: 0, comments: 0 }
      existing.likes += media.likeCount
      existing.comments += media.commentsCount
      dailyMap.set(date, existing)
    }

    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({ date, ...metrics }))
  }
}
