import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account, PlatformType } from '@crossboost/database'
import { BaseDataProvider, DataCubeResult } from './base-data.provider'
import { TikTokShopService } from '../../platforms/tiktok-shop/tiktok-shop.service'

@Injectable()
export class TikTokDataProvider extends BaseDataProvider {
  readonly platform = 'tiktok_shop'

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly tiktokService: TikTokShopService,
  ) {
    super()
  }

  async getAccountDataCube(accountId: string): Promise<DataCubeResult> {
    this.logger.log(`Getting TikTok data cube for account: ${accountId}`)

    const account = await this.accountRepo.findOne({ where: { id: accountId } })
    if (!account?.accessToken) {
      throw new Error('TikTok account not connected')
    }

    const accessToken = await this.tiktokService.getValidAccessToken(accountId)

    const videos = await this.tiktokService.getVideoList(accessToken, 50)
    const videoIds = videos.map((v: Record<string, unknown>) => v.id as string).filter(Boolean)

    let videoInsights: Array<{ videoId: string; views: number; likes: number; comments: number; shares: number }> = []
    if (videoIds.length > 0) {
      videoInsights = await this.tiktokService.getVideoInsights(accessToken, videoIds)
    }

    const totalViews = videoInsights.reduce((sum, v) => sum + v.views, 0)
    const totalLikes = videoInsights.reduce((sum, v) => sum + v.likes, 0)
    const totalComments = videoInsights.reduce((sum, v) => sum + v.comments, 0)
    const totalShares = videoInsights.reduce((sum, v) => sum + v.shares, 0)
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 : 0

    const topContent = videoInsights
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map((v) => {
        const video = videos.find((vid: Record<string, unknown>) => vid.id === v.videoId) as Record<string, unknown> | undefined
        return {
          contentId: v.videoId,
          title: (video?.title as string) || 'Untitled',
          views: v.views,
          likes: v.likes,
          engagementRate: v.views > 0 ? ((v.likes + v.comments + v.shares) / v.views) * 100 : 0,
        }
      })

    const timeSeries = this.buildTimeSeries(videos, videoInsights)

    return {
      accountId,
      platform: this.platform,
      metrics: {
        followers: account.followers || 0,
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        engagementRate,
      },
      timeSeries,
      topContent,
    }
  }

  async getContentDataCube(accountId: string, contentId: string): Promise<DataCubeResult> {
    this.logger.log(`Getting TikTok content data cube: ${contentId}`)

    const accessToken = await this.tiktokService.getValidAccessToken(accountId)
    const insights = await this.tiktokService.getVideoInsights(accessToken, [contentId])
    const insight = insights[0] || { views: 0, likes: 0, comments: 0, shares: 0 }

    const engagementRate = insight.views > 0
      ? ((insight.likes + insight.comments + insight.shares) / insight.views) * 100
      : 0

    return {
      accountId,
      platform: this.platform,
      metrics: {
        followers: 0,
        views: insight.views,
        likes: insight.likes,
        comments: insight.comments,
        shares: insight.shares,
        engagementRate,
      },
    }
  }

  async getAccountGrowth(accountId: string, days: number): Promise<{
    followersGrowth: number
    viewsGrowth: number
    engagementGrowth: number
  }> {
    this.logger.log(`Getting TikTok growth for ${days} days`)

    try {
      const accessToken = await this.tiktokService.getValidAccessToken(accountId)
      const videos = await this.tiktokService.getVideoList(accessToken, 50)

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const recentVideos = videos.filter((v: Record<string, unknown>) => {
        const createTime = v.create_time as number | undefined
        return createTime && new Date(createTime * 1000) >= cutoffDate
      })

      const recentVideoIds = recentVideos.map((v: Record<string, unknown>) => v.id as string).filter(Boolean)
      let recentViews = 0
      let recentLikes = 0
      let recentComments = 0

      if (recentVideoIds.length > 0) {
        const insights = await this.tiktokService.getVideoInsights(accessToken, recentVideoIds)
        recentViews = insights.reduce((s, v) => s + v.views, 0)
        recentLikes = insights.reduce((s, v) => s + v.likes, 0)
        recentComments = insights.reduce((s, v) => s + v.comments, 0)
      }

      return {
        followersGrowth: recentVideos.length,
        viewsGrowth: recentViews,
        engagementGrowth: recentViews > 0 ? ((recentLikes + recentComments) / recentViews) * 100 : 0,
      }
    } catch {
      return { followersGrowth: 0, viewsGrowth: 0, engagementGrowth: 0 }
    }
  }

  private buildTimeSeries(
    videos: Array<Record<string, unknown>>,
    insights: Array<{ videoId: string; views: number; likes: number; comments: number; shares: number }>,
  ): Array<{ date: string; views: number; likes: number; comments: number }> {
    const dailyMap = new Map<string, { views: number; likes: number; comments: number }>()

    for (const video of videos) {
      const createTime = video.create_time as number | undefined
      if (!createTime) continue

      const date = new Date(createTime * 1000).toISOString().split('T')[0]
      const insight = insights.find((i) => i.videoId === video.id)

      const existing = dailyMap.get(date) || { views: 0, likes: 0, comments: 0 }
      existing.views += insight?.views || 0
      existing.likes += insight?.likes || 0
      existing.comments += insight?.comments || 0
      dailyMap.set(date, existing)
    }

    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({ date, ...metrics }))
  }
}
