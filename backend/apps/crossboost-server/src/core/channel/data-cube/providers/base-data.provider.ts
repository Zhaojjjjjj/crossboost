import { Injectable, Logger } from '@nestjs/common'

export interface DataCubeResult {
  accountId: string
  platform: string
  metrics: {
    followers: number
    views: number
    likes: number
    comments: number
    shares: number
    engagementRate: number
  }
  timeSeries?: Array<{
    date: string
    views: number
    likes: number
    comments: number
  }>
  topContent?: Array<{
    contentId: string
    title: string
    views: number
    likes: number
    engagementRate: number
  }>
}

@Injectable()
export abstract class BaseDataProvider {
  protected readonly logger = new Logger(this.constructor.name)

  abstract readonly platform: string

  abstract getAccountDataCube(accountId: string): Promise<DataCubeResult>

  abstract getContentDataCube(accountId: string, contentId: string): Promise<DataCubeResult>

  abstract getAccountGrowth(accountId: string, days: number): Promise<{
    followersGrowth: number
    viewsGrowth: number
    engagementGrowth: number
  }>
}
