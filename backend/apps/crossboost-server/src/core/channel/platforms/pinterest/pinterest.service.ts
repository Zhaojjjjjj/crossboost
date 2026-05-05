import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account, PlatformType } from '@crossboost/database'
import axios from 'axios'

export interface PinterestPin {
  pinId: string
  title: string
  description: string
  imageUrl: string
  link?: string
  boardId: string
}

interface PinterestTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

@Injectable()
export class PinterestService {
  private readonly logger = new Logger(PinterestService.name)
  private readonly baseUrl = 'https://api.pinterest.com/v5'

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  getAuthorizationUrl(redirectUri: string): string {
    const clientId = process.env.PINTEREST_CLIENT_ID
    if (!clientId) {
      throw new Error('PINTEREST_CLIENT_ID environment variable is not set')
    }
    const state = `pinterest_${Date.now()}`
    return `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=boards:read,pins:read,pins:write,boards:write,user_accounts:read&state=${state}`
  }

  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const clientId = process.env.PINTEREST_CLIENT_ID
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('Pinterest client credentials are not configured')
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const { data } = await axios.post<PinterestTokenResponse>(
      'https://api.pinterest.com/v5/oauth/token',
      `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI || '')}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const result = await this.exchangeCodeForToken(code)
    return { accessToken: result.accessToken, refreshToken: result.refreshToken }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const clientId = process.env.PINTEREST_CLIENT_ID
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('Pinterest client credentials are not configured')
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const { data } = await axios.post<PinterestTokenResponse>(
      'https://api.pinterest.com/v5/oauth/token',
      `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }

  async saveAccountTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<Account> {
    const userInfo = await this.getUserInfo(accessToken)

    let account = await this.accountRepo.findOne({
      where: { userId, platform: PlatformType.Pinterest, platformAccountId: userInfo.id },
    })

    if (account) {
      account.accessToken = accessToken
      account.refreshToken = refreshToken
      account.expiresAt = expiresAt
      account.platformUsername = userInfo.username
      account.displayName = userInfo.displayName
      account.avatarUrl = userInfo.avatarUrl
    } else {
      account = this.accountRepo.create({
        userId,
        platform: PlatformType.Pinterest,
        platformAccountId: userInfo.id,
        platformUsername: userInfo.username,
        displayName: userInfo.displayName,
        avatarUrl: userInfo.avatarUrl,
        accessToken,
        refreshToken,
        expiresAt,
      })
    }

    return this.accountRepo.save(account)
  }

  async getValidAccessToken(accountId: string): Promise<string> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } })
    if (!account?.accessToken) {
      throw new Error('Pinterest account not connected')
    }

    if (account.expiresAt && account.expiresAt.getTime() < Date.now() + 60_000) {
      if (!account.refreshToken) {
        throw new Error('Pinterest token expired and no refresh token available')
      }
      const refreshed = await this.refreshToken(account.refreshToken)
      account.accessToken = refreshed.accessToken
      account.refreshToken = refreshed.refreshToken
      account.expiresAt = refreshed.expiresAt
      await this.accountRepo.save(account)
    }

    return account.accessToken
  }

  private async getUserInfo(accessToken: string): Promise<{
    id: string
    username: string
    displayName: string
    avatarUrl: string
  }> {
    const { data } = await axios.get<{
      id: string
      username: string
      display_name: string
      profile_image: string
    }>(`${this.baseUrl}/user_account`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.profile_image,
    }
  }

  async getAccountInfo(accessToken: string): Promise<{ userId: string; username: string; displayName: string }> {
    const info = await this.getUserInfo(accessToken)
    return { userId: info.id, username: info.username, displayName: info.displayName }
  }

  async getBoards(accessToken: string): Promise<Array<{ id: string; name: string; pinCount: number; description: string }>> {
    const boards: Array<{ id: string; name: string; pinCount: number; description: string }> = []
    let bookmark: string | undefined

    do {
      const params: Record<string, unknown> = { page_size: 25 }
      if (bookmark) params.bookmark = bookmark

      const { data } = await axios.get<{
        items: Array<{
          id: string
          name: string
          pin_count: number
          description: string
        }>
        bookmark: string
      }>(`${this.baseUrl}/boards`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      })

      for (const board of data.items || []) {
        boards.push({
          id: board.id,
          name: board.name,
          pinCount: board.pin_count || 0,
          description: board.description,
        })
      }

      bookmark = data.bookmark
    } while (bookmark)

    return boards
  }

  async createBoard(accessToken: string, name: string, description?: string): Promise<{ id: string; name: string }> {
    const { data } = await axios.post<{ id: string; name: string }>(
      `${this.baseUrl}/boards`,
      { name, description: description || '' },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    return { id: data.id, name: data.name }
  }

  async createPin(accessToken: string, pinData: {
    boardId: string
    title: string
    description: string
    imageUrl: string
    link?: string
    tags?: string[]
  }): Promise<PinterestPin> {
    const description = this.buildDescription(pinData.description, pinData.tags)

    const { data } = await axios.post<{
      id: string
      title: string
      description: string
      media: { image_url?: string }
      link: string
      board_id: string
    }>(
      `${this.baseUrl}/pins`,
      {
        board_id: pinData.boardId,
        title: pinData.title,
        description,
        media_source: {
          source_type: 'image_url',
          url: pinData.imageUrl,
        },
        link: pinData.link || undefined,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    return {
      pinId: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.media?.image_url || pinData.imageUrl,
      link: data.link,
      boardId: data.board_id,
    }
  }

  async createVideoPin(accessToken: string, pinData: {
    boardId: string
    title: string
    description: string
    videoUrl: string
    coverImageUrl?: string
    link?: string
  }): Promise<PinterestPin> {
    const { data } = await axios.post<{
      id: string
      title: string
      description: string
      media: { image_url?: string }
      link: string
      board_id: string
    }>(
      `${this.baseUrl}/pins`,
      {
        board_id: pinData.boardId,
        title: pinData.title,
        description: pinData.description,
        media_source: {
          source_type: 'video_id',
          cover_image_url: pinData.coverImageUrl,
          url: pinData.videoUrl,
        },
        link: pinData.link || undefined,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    return {
      pinId: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.media?.image_url || '',
      link: data.link,
      boardId: data.board_id,
    }
  }

  async getPins(accessToken: string, boardId?: string, pageSize = 25): Promise<Array<{
    id: string
    title: string
    description: string
    imageUrl: string
    link: string
    createdAt: string
  }>> {
    const endpoint = boardId ? `${this.baseUrl}/boards/${boardId}/pins` : `${this.baseUrl}/pins`
    const { data } = await axios.get<{
      items: Array<{
        id: string
        title: string
        description: string
        media: { image_url?: string }
        link: string
        created_at: string
      }>
    }>(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page_size: pageSize },
    })

    return (data.items || []).map((pin) => ({
      id: pin.id,
      title: pin.title,
      description: pin.description,
      imageUrl: pin.media?.image_url || '',
      link: pin.link,
      createdAt: pin.created_at,
    }))
  }

  async getPinAnalytics(accessToken: string, pinId: string): Promise<{
    impressions: number
    saves: number
    pinClicks: number
    outboundClicks: number
    videoViews?: number
  }> {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = new Date().toISOString().split('T')[0]

    const { data } = await axios.get<{
      summary: {
        impressions?: number
        saves?: number
        pin_clicks?: number
        outbound_clicks?: number
        video_views?: number
      }
    }>(
      `${this.baseUrl}/pins/${pinId}/analytics`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate,
          end_date: endDate,
          app_types: 'web',
        },
      },
    )

    return {
      impressions: data.summary?.impressions || 0,
      saves: data.summary?.saves || 0,
      pinClicks: data.summary?.pin_clicks || 0,
      outboundClicks: data.summary?.outbound_clicks || 0,
      videoViews: data.summary?.video_views,
    }
  }

  async getAccountAnalytics(accessToken: string): Promise<{
    impressions: number
    saves: number
    pinClicks: number
    outboundClicks: number
    followers: number
  }> {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = new Date().toISOString().split('T')[0]

    const { data } = await axios.get<{
      summary: {
        impressions?: number
        saves?: number
        pin_clicks?: number
        outbound_clicks?: number
        followers?: number
      }
    }>(
      `${this.baseUrl}/user_account/analytics`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate,
          end_date: endDate,
          app_types: 'web',
        },
      },
    )

    return {
      impressions: data.summary?.impressions || 0,
      saves: data.summary?.saves || 0,
      pinClicks: data.summary?.pin_clicks || 0,
      outboundClicks: data.summary?.outbound_clicks || 0,
      followers: data.summary?.followers || 0,
    }
  }

  private buildDescription(description: string, tags?: string[]): string {
    if (tags && tags.length > 0) {
      const tagString = tags.map((t) => `#${t}`).join(' ')
      return `${description}\n\n${tagString}`
    }
    return description
  }
}
