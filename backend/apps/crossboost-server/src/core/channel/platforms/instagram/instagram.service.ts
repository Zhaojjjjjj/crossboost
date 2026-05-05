import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account, PlatformType } from '@crossboost/database'
import axios from 'axios'

export interface InstagramMedia {
  mediaId: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL'
  caption?: string
  permalink: string
  timestamp: string
}

interface FacebookTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface InstagramBusinessAccount {
  id: string
  name: string
  username: string
  profile_picture_url: string
  followers_count: number
  media_count: number
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name)
  private readonly graphApiBaseUrl = 'https://graph.facebook.com/v19.0'

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  getAuthorizationUrl(redirectUri: string): string {
    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID
    if (!clientId) {
      throw new Error('INSTAGRAM_CLIENT_ID or FACEBOOK_APP_ID environment variable is not set')
    }
    const state = `instagram_${Date.now()}`
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_read_engagement&state=${state}&response_type=code`
  }

  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('Instagram client credentials are not configured')
    }

    const { data } = await axios.get<FacebookTokenResponse>(
      `${this.graphApiBaseUrl}/oauth/access_token`,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
          code,
        },
      },
    )

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; userId: string }> {
    const result = await this.exchangeCodeForToken(code)
    const userInfo = await this.getUserInfo(result.accessToken)
    return { accessToken: result.accessToken, userId: userInfo.id }
  }

  async refreshLongLivedToken(accessToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET
    if (!clientSecret) {
      throw new Error('Instagram client secret is not configured')
    }

    const { data } = await axios.get<FacebookTokenResponse>(
      `${this.graphApiBaseUrl}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID,
          client_secret: clientSecret,
          fb_exchange_token: accessToken,
        },
      },
    )

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }

  private async getUserInfo(accessToken: string): Promise<{ id: string; name: string }> {
    const { data } = await axios.get<{ id: string; name: string }>(
      `${this.graphApiBaseUrl}/me`,
      { params: { access_token: accessToken, fields: 'id,name' } },
    )
    return data
  }

  async getInstagramBusinessAccount(accessToken: string): Promise<InstagramBusinessAccount> {
    const { data } = await axios.get<{ id: string }>(
      `${this.graphApiBaseUrl}/me`,
      { params: { access_token: accessToken, fields: 'id' } },
    )

    const { data: pagesData } = await axios.get<{ data: Array<{ id: string; instagram_business_account?: { id: string } }> }>(
      `${this.graphApiBaseUrl}/${data.id}/accounts`,
      { params: { access_token: accessToken, fields: 'instagram_business_account' } },
    )

    const igAccountId = pagesData.data?.[0]?.instagram_business_account?.id
    if (!igAccountId) {
      throw new Error('No Instagram Business account found linked to this Facebook account')
    }

    const { data: igAccount } = await axios.get<InstagramBusinessAccount>(
      `${this.graphApiBaseUrl}/${igAccountId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,username,profile_picture_url,followers_count,media_count',
        },
      },
    )

    return igAccount
  }

  async getAccountInfo(accessToken: string): Promise<{ userId: string; username: string; followersCount: number }> {
    const account = await this.getInstagramBusinessAccount(accessToken)
    return {
      userId: account.id,
      username: account.username,
      followersCount: account.followers_count,
    }
  }

  async saveAccountTokens(
    userId: string,
    accessToken: string,
    expiresAt: Date,
    igAccount: InstagramBusinessAccount,
  ): Promise<Account> {
    let account = await this.accountRepo.findOne({
      where: { userId, platform: PlatformType.Instagram, platformAccountId: igAccount.id },
    })

    if (account) {
      account.accessToken = accessToken
      account.expiresAt = expiresAt
      account.platformUsername = igAccount.username
      account.displayName = igAccount.name
      account.avatarUrl = igAccount.profile_picture_url
      account.followers = igAccount.followers_count
    } else {
      account = this.accountRepo.create({
        userId,
        platform: PlatformType.Instagram,
        platformAccountId: igAccount.id,
        platformUsername: igAccount.username,
        displayName: igAccount.name,
        avatarUrl: igAccount.profile_picture_url,
        accessToken,
        expiresAt,
        followers: igAccount.followers_count,
      })
    }

    return this.accountRepo.save(account)
  }

  async getValidAccessToken(accountId: string): Promise<string> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } })
    if (!account?.accessToken) {
      throw new Error('Instagram account not connected')
    }

    if (account.expiresAt && account.expiresAt.getTime() < Date.now() + 86400_000) {
      const refreshed = await this.refreshLongLivedToken(account.accessToken)
      account.accessToken = refreshed.accessToken
      account.expiresAt = refreshed.expiresAt
      await this.accountRepo.save(account)
    }

    return account.accessToken
  }

  async publishImage(accessToken: string, data: {
    imageUrl: string
    caption: string
    tags?: string[]
  }): Promise<InstagramMedia> {
    const igAccount = await this.getInstagramBusinessAccount(accessToken)
    const caption = this.buildCaption(data.caption, data.tags)

    const { data: containerData } = await axios.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igAccount.id}/media`,
      { image_url: data.imageUrl, caption },
      { params: { access_token: accessToken } },
    )

    const { data: publishData } = await axios.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igAccount.id}/media_publish`,
      { creation_id: containerData.id },
      { params: { access_token: accessToken } },
    )

    const mediaInfo = await this.getMediaInfo(accessToken, publishData.id)

    return {
      mediaId: publishData.id,
      mediaType: 'IMAGE',
      caption: data.caption,
      permalink: mediaInfo.permalink,
      timestamp: mediaInfo.timestamp,
    }
  }

  async publishVideo(accessToken: string, data: {
    videoUrl: string
    caption: string
    coverUrl?: string
  }): Promise<InstagramMedia> {
    const igAccount = await this.getInstagramBusinessAccount(accessToken)

    const containerPayload: Record<string, unknown> = {
      media_type: 'REELS',
      video_url: data.videoUrl,
      caption: data.caption,
    }
    if (data.coverUrl) {
      containerPayload.cover_url = data.coverUrl
    }

    const { data: containerData } = await axios.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igAccount.id}/media`,
      containerPayload,
      { params: { access_token: accessToken } },
    )

    await this.waitForMediaReady(accessToken, containerData.id, 60_000)

    const { data: publishData } = await axios.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igAccount.id}/media_publish`,
      { creation_id: containerData.id },
      { params: { access_token: accessToken } },
    )

    const mediaInfo = await this.getMediaInfo(accessToken, publishData.id)

    return {
      mediaId: publishData.id,
      mediaType: 'VIDEO',
      caption: data.caption,
      permalink: mediaInfo.permalink,
      timestamp: mediaInfo.timestamp,
    }
  }

  async publishCarousel(accessToken: string, data: {
    items: Array<{ imageUrl: string; caption?: string }>
    caption: string
  }): Promise<InstagramMedia> {
    const igAccount = await this.getInstagramBusinessAccount(accessToken)

    const childrenIds: string[] = []
    for (const item of data.items) {
      const { data: childData } = await axios.post<{ id: string }>(
        `${this.graphApiBaseUrl}/${igAccount.id}/media`,
        { image_url: item.imageUrl, is_carousel_item: true },
        { params: { access_token: accessToken } },
      )
      childrenIds.push(childData.id)
    }

    const { data: containerData } = await axios.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igAccount.id}/media`,
      {
        media_type: 'CAROUSEL',
        children: childrenIds,
        caption: data.caption,
      },
      { params: { access_token: accessToken } },
    )

    const { data: publishData } = await axios.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igAccount.id}/media_publish`,
      { creation_id: containerData.id },
      { params: { access_token: accessToken } },
    )

    const mediaInfo = await this.getMediaInfo(accessToken, publishData.id)

    return {
      mediaId: publishData.id,
      mediaType: 'CAROUSEL',
      caption: data.caption,
      permalink: mediaInfo.permalink,
      timestamp: mediaInfo.timestamp,
    }
  }

  async getMediaInsights(accessToken: string, mediaId: string): Promise<{
    impressions: number
    reach: number
    engagement: number
    saved: number
    videoViews?: number
  }> {
    const mediaInfo = await this.getMediaInfo(accessToken, mediaId)
    const isVideo = mediaInfo.media_type === 'VIDEO' || mediaInfo.media_type === 'REELS'

    const metrics = isVideo
      ? 'impressions,reach,saved,video_views'
      : 'impressions,reach,saved'

    const { data } = await axios.get<{
      data: Array<{ name: string; values: Array<{ value: number }> }>
    }>(
      `${this.graphApiBaseUrl}/${mediaId}/insights`,
      { params: { access_token: accessToken, metric: metrics } },
    )

    const result: Record<string, number> = {}
    for (const metric of data.data) {
      result[metric.name] = metric.values[0]?.value || 0
    }

    return {
      impressions: result.impressions || 0,
      reach: result.reach || 0,
      engagement: (result.saved || 0),
      saved: result.saved || 0,
      videoViews: result.video_views,
    }
  }

  async getAccountInsights(accessToken: string, accountId: string, period = 'day', since?: string, until?: string): Promise<{
    impressions: number
    reach: number
    followerCount: number
    emailContacts: number
    phoneCallClicks: number
    textMessageClicks: number
    getDirectionsClicks: number
    websiteClicks: number
    profileViews: number
  }> {
    const params: Record<string, string> = {
      access_token: accessToken,
      metric: 'impressions,reach,follower_count,email_contacts,phone_call_clicks,text_message_clicks,get_directions_clicks,website_clicks,profile_views',
      period,
    }
    if (since) params.since = since
    if (until) params.until = until

    const { data } = await axios.get<{
      data: Array<{ name: string; values: Array<{ value: number }> }>
    }>(`${this.graphApiBaseUrl}/${accountId}/insights`, { params })

    const result: Record<string, number> = {}
    for (const metric of data.data) {
      result[metric.name] = metric.values.reduce((sum, v) => sum + v.value, 0)
    }

    return {
      impressions: result.impressions || 0,
      reach: result.reach || 0,
      followerCount: result.follower_count || 0,
      emailContacts: result.email_contacts || 0,
      phoneCallClicks: result.phone_call_clicks || 0,
      textMessageClicks: result.text_message_clicks || 0,
      getDirectionsClicks: result.get_directions_clicks || 0,
      websiteClicks: result.website_clicks || 0,
      profileViews: result.profile_views || 0,
    }
  }

  async getMediaList(accessToken: string, igAccountId: string, limit = 25): Promise<Array<{
    id: string
    mediaType: string
    caption: string
    permalink: string
    timestamp: string
    likeCount: number
    commentsCount: number
  }>> {
    const { data } = await axios.get<{
      data: Array<{
        id: string
        media_type: string
        caption: string
        permalink: string
        timestamp: string
        like_count: number
        comments_count: number
      }>
    }>(
      `${this.graphApiBaseUrl}/${igAccountId}/media`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,media_type,caption,permalink,timestamp,like_count,comments_count',
          limit,
        },
      },
    )

    return (data.data || []).map((m) => ({
      id: m.id,
      mediaType: m.media_type,
      caption: m.caption,
      permalink: m.permalink,
      timestamp: m.timestamp,
      likeCount: m.like_count || 0,
      commentsCount: m.comments_count || 0,
    }))
  }

  async getComments(accessToken: string, mediaId: string): Promise<Array<{
    id: string
    text: string
    username: string
    timestamp: string
  }>> {
    const { data } = await axios.get<{
      data: Array<{
        id: string
        text: string
        username: string
        timestamp: string
      }>
    }>(
      `${this.graphApiBaseUrl}/${mediaId}/comments`,
      { params: { access_token: accessToken, fields: 'id,text,username,timestamp' } },
    )

    return data.data || []
  }

  async replyToComment(accessToken: string, commentId: string, message: string): Promise<{ id: string }> {
    const { data } = await axios.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${commentId}/replies`,
      { message },
      { params: { access_token: accessToken } },
    )
    return data
  }

  async deleteComment(accessToken: string, commentId: string): Promise<boolean> {
    const { data } = await axios.delete<{ success: boolean }>(
      `${this.graphApiBaseUrl}/${commentId}`,
      { params: { access_token: accessToken } },
    )
    return data.success
  }

  private async getMediaInfo(accessToken: string, mediaId: string): Promise<{
    permalink: string
    timestamp: string
    media_type: string
  }> {
    const { data } = await axios.get<{
      permalink: string
      timestamp: string
      media_type: string
    }>(
      `${this.graphApiBaseUrl}/${mediaId}`,
      { params: { access_token: accessToken, fields: 'permalink,timestamp,media_type' } },
    )
    return data
  }

  private async waitForMediaReady(accessToken: string, containerId: string, timeoutMs: number): Promise<void> {
    const startTime = Date.now()
    while (Date.now() - startTime < timeoutMs) {
      const { data } = await axios.get<{ status_code: string }>(
        `${this.graphApiBaseUrl}/${containerId}`,
        { params: { access_token: accessToken, fields: 'status_code' } },
      )

      if (data.status_code === 'FINISHED') return
      if (data.status_code === 'ERROR') {
        throw new Error('Instagram media processing failed')
      }

      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
    throw new Error('Instagram media processing timed out')
  }

  private buildCaption(description: string, tags?: string[]): string {
    if (tags && tags.length > 0) {
      const tagString = tags.map((t) => `#${t}`).join(' ')
      return `${description}\n\n${tagString}`
    }
    return description
  }
}
