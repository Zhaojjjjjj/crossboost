import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account, PlatformType } from '@crossboost/database'
import axios from 'axios'

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string
  publishedAt: string
  viewCount: number
  likeCount: number
}

interface GoogleTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name)
  private readonly apiBaseUrl = 'https://www.googleapis.com/youtube/v3'
  private readonly analyticsBaseUrl = 'https://youtubeanalytics.googleapis.com/v2'
  private readonly oauthBaseUrl = 'https://oauth2.googleapis.com'

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  getAuthorizationUrl(redirectUri: string): string {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error('YOUTUBE_CLIENT_ID or GOOGLE_CLIENT_ID environment variable is not set')
    }
    const scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ')

    return `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=youtube_${Date.now()}`
  }

  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('YouTube client credentials are not configured')
    }

    const { data } = await axios.post<GoogleTokenResponse>(
      `${this.oauthBaseUrl}/token`,
      {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      },
    )

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const result = await this.exchangeCodeForToken(code)
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: Math.floor((result.expiresAt.getTime() - Date.now()) / 1000),
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('YouTube client credentials are not configured')
    }

    const { data } = await axios.post<GoogleTokenResponse>(
      `${this.oauthBaseUrl}/token`,
      {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      },
    )

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }

  async saveAccountTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<Account> {
    const channelInfo = await this.getChannelInfo(accessToken)

    let account = await this.accountRepo.findOne({
      where: { userId, platform: PlatformType.YouTube, platformAccountId: channelInfo.channelId },
    })

    if (account) {
      account.accessToken = accessToken
      account.refreshToken = refreshToken
      account.expiresAt = expiresAt
      account.displayName = channelInfo.channelTitle
      account.followers = channelInfo.subscriberCount
    } else {
      account = this.accountRepo.create({
        userId,
        platform: PlatformType.YouTube,
        platformAccountId: channelInfo.channelId,
        displayName: channelInfo.channelTitle,
        accessToken,
        refreshToken,
        expiresAt,
        followers: channelInfo.subscriberCount,
      })
    }

    return this.accountRepo.save(account)
  }

  async getValidAccessToken(accountId: string): Promise<string> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } })
    if (!account?.accessToken) {
      throw new Error('YouTube account not connected')
    }

    if (account.expiresAt && account.expiresAt.getTime() < Date.now() + 60_000) {
      if (!account.refreshToken) {
        throw new Error('YouTube token expired and no refresh token available')
      }
      const refreshed = await this.refreshToken(account.refreshToken)
      account.accessToken = refreshed.accessToken
      account.expiresAt = refreshed.expiresAt
      await this.accountRepo.save(account)
    }

    return account.accessToken
  }

  async getChannelInfo(accessToken: string): Promise<{ channelId: string; channelTitle: string; subscriberCount: number }> {
    const { data } = await axios.get<{
      items: Array<{
        id: string
        snippet: { title: string; description: string; thumbnails: Record<string, { url: string }> }
        statistics: { subscriberCount: string; videoCount: string; viewCount: string }
      }>
    }>(`${this.apiBaseUrl}/channels`, {
      params: { part: 'snippet,statistics', mine: true },
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const channel = data.items?.[0]
    if (!channel) {
      throw new Error('No YouTube channel found for this account')
    }

    return {
      channelId: channel.id,
      channelTitle: channel.snippet.title,
      subscriberCount: Number.parseInt(channel.statistics.subscriberCount, 10) || 0,
    }
  }

  async uploadVideo(accessToken: string, videoData: {
    title: string
    description: string
    videoUrl: string
    thumbnailUrl?: string
    tags?: string[]
    categoryId?: string
    privacyStatus?: 'public' | 'private' | 'unlisted'
  }): Promise<YouTubeVideo> {
    const videoMetadata = {
      snippet: {
        title: videoData.title,
        description: videoData.description,
        tags: videoData.tags,
        categoryId: videoData.categoryId || '22',
      },
      status: {
        privacyStatus: videoData.privacyStatus || 'public',
        selfDeclaredMadeForKids: false,
      },
    }

    const videoResponse = await axios.get<ArrayBuffer>(videoData.videoUrl, { responseType: 'arraybuffer' })
    const videoBuffer = videoResponse.data

    const { headers: uploadHeaders } = await axios.post<{ headers: Record<string, string> }>(
      `${this.apiBaseUrl}/videos`,
      null,
      {
        params: { part: 'snippet,status', uploadType: 'resumable' },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/*',
          'X-Upload-Content-Length': String(videoBuffer.byteLength),
        },
        data: videoMetadata,
        maxRedirects: 0,
        validateStatus: (status) => status === 200 || status === 308,
      },
    ).catch((err) => {
      if (err.response?.headers?.location) {
        return { headers: { location: err.response.headers.location } }
      }
      throw err
    })

    const uploadUrl = uploadHeaders.location
    if (!uploadUrl) {
      throw new Error('Failed to get YouTube upload URL')
    }

    const { data: uploadResult } = await axios.put<{
      id: string
      snippet: { title: string; description: string; thumbnails: Record<string, { url: string }> }
      statistics: { viewCount: string; likeCount: string }
    }>(uploadUrl, videoBuffer, {
      headers: { 'Content-Type': 'video/*' },
    })

    if (videoData.thumbnailUrl) {
      await this.setThumbnail(accessToken, uploadResult.id, videoData.thumbnailUrl)
    }

    return {
      videoId: uploadResult.id,
      title: uploadResult.snippet.title,
      description: videoData.description,
      thumbnailUrl: uploadResult.snippet.thumbnails?.high?.url || '',
      publishedAt: new Date().toISOString(),
      viewCount: Number.parseInt(uploadResult.statistics?.viewCount, 10) || 0,
      likeCount: Number.parseInt(uploadResult.statistics?.likeCount, 10) || 0,
    }
  }

  private async setThumbnail(accessToken: string, videoId: string, thumbnailUrl: string): Promise<void> {
    try {
      const thumbnailResponse = await axios.get<ArrayBuffer>(thumbnailUrl, { responseType: 'arraybuffer' })
      await axios.post(
        `https://www.googleapis.com/upload/youtube/v3/thumbnails/set`,
        thumbnailResponse.data,
        {
          params: { videoId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'image/jpeg',
          },
        },
      )
    } catch (error) {
      this.logger.warn(`Failed to set thumbnail for video ${videoId}: ${error}`)
    }
  }

  async getVideoList(accessToken: string, maxResults = 50): Promise<YouTubeVideo[]> {
    const { data: channelData } = await axios.get<{
      items: Array<{ id: string }>
    }>(`${this.apiBaseUrl}/channels`, {
      params: { part: 'id', mine: true },
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const channelId = channelData.items?.[0]?.id
    if (!channelId) return []

    const { data } = await axios.get<{
      items: Array<{
        id: { videoId: string }
        snippet: {
          title: string
          description: string
          thumbnails: Record<string, { url: string }>
          publishedAt: string
        }
      }>
    }>(`${this.apiBaseUrl}/search`, {
      params: {
        part: 'snippet',
        channelId,
        maxResults,
        order: 'date',
        type: 'video',
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const videoIds = (data.items || []).map((item) => item.id.videoId).filter(Boolean)
    if (videoIds.length === 0) return []

    const { data: statsData } = await axios.get<{
      items: Array<{
        id: string
        statistics: { viewCount: string; likeCount: string }
      }>
    }>(`${this.apiBaseUrl}/videos`, {
      params: { part: 'statistics', id: videoIds.join(',') },
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const statsMap = new Map(statsData.items?.map((v) => [v.id, v.statistics]) || [])

    return (data.items || []).map((item) => {
      const videoId = item.id.videoId
      const stats = statsMap.get(videoId)
      return {
        videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || '',
        publishedAt: item.snippet.publishedAt,
        viewCount: Number.parseInt(stats?.viewCount, 10) || 0,
        likeCount: Number.parseInt(stats?.likeCount, 10) || 0,
      }
    })
  }

  async getVideoAnalytics(accessToken: string, videoId: string): Promise<{
    views: number
    likes: number
    comments: number
    shares: number
    averageViewDuration: number
    estimatedMinutesWatched: number
  }> {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: channelData } = await axios.get<{ items: Array<{ id: string }> }>(
        `${this.apiBaseUrl}/channels`,
        { params: { part: 'id', mine: true }, headers: { Authorization: `Bearer ${accessToken}` } },
      )
      const channelId = channelData.items?.[0]?.id

      const { data } = await axios.get<{
        rows: Array<Array<number>>
      }>(`${this.analyticsBaseUrl}/reports`, {
        params: {
          ids: `channel==${channelId}`,
          startDate,
          endDate,
          metrics: 'views,likes,comments,shares,averageViewDuration,estimatedMinutesWatched',
          dimensions: 'video',
          filters: `video==${videoId}`,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const row = data.rows?.[0] || [0, 0, 0, 0, 0, 0]
      return {
        views: row[0] || 0,
        likes: row[1] || 0,
        comments: row[2] || 0,
        shares: row[3] || 0,
        averageViewDuration: row[4] || 0,
        estimatedMinutesWatched: row[5] || 0,
      }
    } catch {
      const { data: statsData } = await axios.get<{
        items: Array<{
          statistics: {
            viewCount: string
            likeCount: string
            commentCount: string
          }
        }>
      }>(`${this.apiBaseUrl}/videos`, {
        params: { part: 'statistics', id: videoId },
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const stats = statsData.items?.[0]?.statistics
      return {
        views: Number.parseInt(stats?.viewCount, 10) || 0,
        likes: Number.parseInt(stats?.likeCount, 10) || 0,
        comments: Number.parseInt(stats?.commentCount, 10) || 0,
        shares: 0,
        averageViewDuration: 0,
        estimatedMinutesWatched: 0,
      }
    }
  }

  async getChannelAnalytics(accessToken: string): Promise<{
    totalViews: number
    totalLikes: number
    totalComments: number
    subscriberCount: number
    estimatedMinutesWatched: number
  }> {
    try {
      const { data: channelData } = await axios.get<{ items: Array<{ id: string }> }>(
        `${this.apiBaseUrl}/channels`,
        { params: { part: 'id', mine: true }, headers: { Authorization: `Bearer ${accessToken}` } },
      )
      const channelId = channelData.items?.[0]?.id

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data } = await axios.get<{
        rows: Array<Array<number>>
      }>(`${this.analyticsBaseUrl}/reports`, {
        params: {
          ids: `channel==${channelId}`,
          startDate,
          endDate,
          metrics: 'views,likes,comments,subscribersGained,estimatedMinutesWatched',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const row = data.rows?.[0] || [0, 0, 0, 0, 0]
      return {
        totalViews: row[0] || 0,
        totalLikes: row[1] || 0,
        totalComments: row[2] || 0,
        subscriberCount: row[3] || 0,
        estimatedMinutesWatched: row[4] || 0,
      }
    } catch {
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        subscriberCount: 0,
        estimatedMinutesWatched: 0,
      }
    }
  }

  async getComments(accessToken: string, videoId: string): Promise<Array<{
    id: string
    text: string
    authorDisplayName: string
    authorChannelId: string
    publishedAt: string
    likeCount: number
  }>> {
    const { data } = await axios.get<{
      items: Array<{
        id: string
        snippet: {
          topLevelComment: {
            id: string
            snippet: {
              textDisplay: string
              authorDisplayName: string
              authorChannelId: { value: string }
              publishedAt: string
              likeCount: number
            }
          }
        }
      }>
    }>(`${this.apiBaseUrl}/commentThreads`, {
      params: {
        part: 'snippet',
        videoId,
        maxResults: 100,
        order: 'time',
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return (data.items || []).map((item) => ({
      id: item.snippet.topLevelComment.id,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
      authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId?.value || '',
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      likeCount: item.snippet.topLevelComment.snippet.likeCount || 0,
    }))
  }

  async replyToComment(accessToken: string, parentId: string, text: string): Promise<{ id: string }> {
    const { data } = await axios.post<{ id: string }>(
      `${this.apiBaseUrl}/comments`,
      {
        snippet: {
          parentId,
          textOriginal: text,
        },
      },
      {
        params: { part: 'snippet' },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    return { id: data.id }
  }

  async deleteComment(accessToken: string, commentId: string): Promise<void> {
    await axios.delete(`${this.apiBaseUrl}/comments`, {
      params: { id: commentId },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }
}
