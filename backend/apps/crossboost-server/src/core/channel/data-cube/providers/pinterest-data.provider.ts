import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account, PlatformType } from '@crossboost/database'
import { BaseDataProvider, DataCubeResult } from './base-data.provider'
import { PinterestService } from '../../platforms/pinterest/pinterest.service'

@Injectable()
export class PinterestDataProvider extends BaseDataProvider {
  readonly platform = 'pinterest'

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly pinterestService: PinterestService,
  ) {
    super()
  }

  async getAccountDataCube(accountId: string): Promise<DataCubeResult> {
    this.logger.log(`Getting Pinterest data cube for account: ${accountId}`)

    const account = await this.accountRepo.findOne({ where: { id: accountId } })
    if (!account?.accessToken) {
      throw new Error('Pinterest account not connected')
    }

    const accessToken = await this.pinterestService.getValidAccessToken(accountId)

    const accountAnalytics = await this.pinterestService.getAccountAnalytics(accessToken)

    const pins = await this.pinterestService.getPins(accessToken, undefined, 50)

    const pinAnalyticsResults = await Promise.allSettled(
      pins.slice(0, 20).map((pin) => this.pinterestService.getPinAnalytics(accessToken, pin.id)),
    )

    const totalImpressions = pinAnalyticsResults.reduce((sum, result) => {
      if (result.status === 'fulfilled') return sum + result.value.impressions
      return sum
    }, 0)

    const totalSaves = pinAnalyticsResults.reduce((sum, result) => {
      if (result.status === 'fulfilled') return sum + result.value.saves
      return sum
    }, 0)

    const totalPinClicks = pinAnalyticsResults.reduce((sum, result) => {
      if (result.status === 'fulfilled') return sum + result.value.pinClicks
      return sum
    }, 0)

    const totalOutboundClicks = pinAnalyticsResults.reduce((sum, result) => {
      if (result.status === 'fulfilled') return sum + result.value.outboundClicks
      return sum
    }, 0)

    const engagementRate = totalImpressions > 0
      ? ((totalSaves + totalPinClicks) / totalImpressions) * 100
      : 0

    const topContent = pins
      .map((pin, index) => {
        const result = pinAnalyticsResults[index]
        const analytics = result?.status === 'fulfilled' ? result.value : null
        return {
          contentId: pin.id,
          title: pin.title || 'Untitled',
          views: analytics?.impressions || 0,
          likes: analytics?.saves || 0,
          engagementRate: analytics?.impressions
            ? ((analytics.saves + analytics.pinClicks) / analytics.impressions) * 100
            : 0,
        }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    const timeSeries = this.buildTimeSeries(pins, pinAnalyticsResults)

    return {
      accountId,
      platform: this.platform,
      metrics: {
        followers: accountAnalytics.followers || account.followers || 0,
        views: accountAnalytics.impressions || totalImpressions,
        likes: totalSaves,
        comments: 0,
        shares: totalPinClicks,
        engagementRate,
      },
      timeSeries,
      topContent,
    }
  }

  async getContentDataCube(accountId: string, contentId: string): Promise<DataCubeResult> {
    this.logger.log(`Getting Pinterest content data cube: ${contentId}`)

    const accessToken = await this.pinterestService.getValidAccessToken(accountId)
    const analytics = await this.pinterestService.getPinAnalytics(accessToken, contentId)

    const engagementRate = analytics.impressions > 0
      ? ((analytics.saves + analytics.pinClicks) / analytics.impressions) * 100
      : 0

    return {
      accountId,
      platform: this.platform,
      metrics: {
        followers: 0,
        views: analytics.impressions,
        likes: analytics.saves,
        comments: 0,
        shares: analytics.pinClicks,
        engagementRate,
      },
    }
  }

  async getAccountGrowth(accountId: string, days: number): Promise<{
    followersGrowth: number
    viewsGrowth: number
    engagementGrowth: number
  }> {
    this.logger.log(`Getting Pinterest growth for ${days} days`)

    try {
      const accessToken = await this.pinterestService.getValidAccessToken(accountId)
      const analytics = await this.pinterestService.getAccountAnalytics(accessToken)

      return {
        followersGrowth: analytics.followers,
        viewsGrowth: analytics.impressions,
        engagementGrowth: analytics.saves + analytics.pinClicks,
      }
    } catch {
      return { followersGrowth: 0, viewsGrowth: 0, engagementGrowth: 0 }
    }
  }

  private buildTimeSeries(
    pins: Array<{ id: string; createdAt: string }>,
    analyticsResults: Array<{ status: string; value?: { impressions: number; saves: number; pinClicks: number } }>,
  ): Array<{ date: string; views: number; likes: number; comments: number }> {
    const dailyMap = new Map<string, { views: number; likes: number; comments: number }>()

    for (let i = 0; i < pins.length; i++) {
      const pin = pins[i]
      const result = analyticsResults[i]
      if (result?.status !== 'fulfilled' || !result.value) continue

      const date = pin.createdAt?.split('T')[0]
      if (!date) continue

      const existing = dailyMap.get(date) || { views: 0, likes: 0, comments: 0 }
      existing.views += result.value.impressions
      existing.likes += result.value.saves
      dailyMap.set(date, existing)
    }

    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({ date, ...metrics }))
  }
}
