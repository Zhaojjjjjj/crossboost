import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account, PlatformType } from '@crossboost/database'
import axios from 'axios'

export interface TikTokShopProduct {
  productId: string
  title: string
  description: string
  price: number
  currency: string
  images: string[]
  status: string
}

interface TikTokTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  open_id: string
  seller_name?: string
  seller_region?: string
}

@Injectable()
export class TikTokShopService {
  private readonly logger = new Logger(TikTokShopService.name)
  private readonly baseUrl = 'https://open-api.tiktok.com'
  private readonly authBaseUrl = 'https://auth.tiktok-shops.com'

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  getAuthorizationUrl(redirectUri: string): string {
    const clientId = process.env.TIKTOK_CLIENT_ID
    if (!clientId) {
      throw new Error('TIKTOK_CLIENT_ID environment variable is not set')
    }
    const state = `tiktok_${Date.now()}`
    return `${this.authBaseUrl}/authorize?app_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  }

  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const clientId = process.env.TIKTOK_CLIENT_ID
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('TikTok client credentials are not configured')
    }

    const { data } = await axios.post<{ code: number; message: string; data: TikTokTokenResponse }>(
      `${this.baseUrl}/token/get`,
      {
        app_id: clientId,
        app_secret: clientSecret,
        code,
        grant_type: 'authorized_code',
      },
    )

    if (data.code !== 0) {
      throw new Error(`TikTok token exchange failed: ${data.message}`)
    }

    return {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresAt: new Date(Date.now() + data.data.expires_in * 1000),
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const clientId = process.env.TIKTOK_CLIENT_ID
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('TikTok client credentials are not configured')
    }

    const { data } = await axios.post<{ code: number; message: string; data: TikTokTokenResponse }>(
      `${this.baseUrl}/token/refresh`,
      {
        app_id: clientId,
        app_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      },
    )

    if (data.code !== 0) {
      throw new Error(`TikTok token refresh failed: ${data.message}`)
    }

    return {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresAt: new Date(Date.now() + data.data.expires_in * 1000),
    }
  }

  async saveAccountTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    platformAccountId: string,
    sellerName?: string,
    sellerRegion?: string,
  ): Promise<Account> {
    let account = await this.accountRepo.findOne({
      where: { userId, platform: PlatformType.TikTokShop, platformAccountId },
    })

    if (account) {
      account.accessToken = accessToken
      account.refreshToken = refreshToken
      account.expiresAt = expiresAt
      if (sellerName) account.platformUsername = sellerName
      if (sellerRegion) {
        account.metadata = { ...(account.metadata || {}), region: sellerRegion }
      }
    } else {
      account = this.accountRepo.create({
        userId,
        platform: PlatformType.TikTokShop,
        platformAccountId,
        platformUsername: sellerName || null,
        accessToken,
        refreshToken,
        expiresAt,
        metadata: sellerRegion ? { region: sellerRegion } : null,
      })
    }

    return this.accountRepo.save(account)
  }

  async getValidAccessToken(accountId: string): Promise<string> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } })
    if (!account?.accessToken) {
      throw new Error('TikTok Shop account not connected')
    }

    if (account.expiresAt && account.expiresAt.getTime() < Date.now() + 60_000) {
      if (!account.refreshToken) {
        throw new Error('TikTok Shop token expired and no refresh token available')
      }
      const refreshed = await this.refreshToken(account.refreshToken)
      account.accessToken = refreshed.accessToken
      account.refreshToken = refreshed.refreshToken
      account.expiresAt = refreshed.expiresAt
      await this.accountRepo.save(account)
    }

    return account.accessToken
  }

  async getShopInfo(accessToken: string): Promise<{ shopId: string; shopName: string; region: string }> {
    const { data } = await axios.post<{
      code: number
      message: string
      data: { shop_id: string; shop_name: string; region: string }
    }>(
      `${this.baseUrl}/seller/get_shop`,
      {},
      { headers: { 'x-tts-access-token': accessToken } },
    )

    if (data.code !== 0) {
      throw new Error(`Failed to get shop info: ${data.message}`)
    }

    return {
      shopId: data.data.shop_id,
      shopName: data.data.shop_name,
      region: data.data.region,
    }
  }

  async getProducts(accessToken: string, params?: { page?: number; pageSize?: number }): Promise<{
    products: TikTokShopProduct[]
    total: number
  }> {
    const { data } = await axios.get<{
      code: number
      message: string
      data: {
        products: Array<{
          product_id: string
          title: string
          description: string
          price: { amount: string; currency: string }
          images: Array<{ url: string }>
          status: string
        }>
        total: number
      }
    }>(`${this.baseUrl}/product/list`, {
      headers: { 'x-tts-access-token': accessToken },
      params: {
        page_number: params?.page || 1,
        page_size: params?.pageSize || 20,
      },
    })

    if (data.code !== 0) {
      throw new Error(`Failed to get products: ${data.message}`)
    }

    return {
      products: (data.data.products || []).map((p) => ({
        productId: p.product_id,
        title: p.title,
        description: p.description,
        price: Number.parseFloat(p.price.amount) || 0,
        currency: p.price.currency,
        images: (p.images || []).map((img) => img.url),
        status: p.status,
      })),
      total: data.data.total || 0,
    }
  }

  async getProduct(accessToken: string, productId: string): Promise<TikTokShopProduct> {
    const { data } = await axios.get<{
      code: number
      message: string
      data: {
        product: {
          product_id: string
          title: string
          description: string
          price: { amount: string; currency: string }
          images: Array<{ url: string }>
          status: string
        }
      }
    }>(`${this.baseUrl}/product/query`, {
      headers: { 'x-tts-access-token': accessToken },
      params: { product_id: productId },
    })

    if (data.code !== 0) {
      throw new Error(`Failed to get product: ${data.message}`)
    }

    const p = data.data.product
    return {
      productId: p.product_id,
      title: p.title,
      description: p.description,
      price: Number.parseFloat(p.price.amount) || 0,
      currency: p.price.currency,
      images: (p.images || []).map((img) => img.url),
      status: p.status,
    }
  }

  async createProduct(accessToken: string, product: {
    title: string
    description: string
    price: number
    currency: string
    images: string[]
  }): Promise<TikTokShopProduct> {
    const { data } = await axios.post<{
      code: number
      message: string
      data: { product_id: string }
    }>(
      `${this.baseUrl}/product/create`,
      {
        title: product.title,
        description: product.description,
        price: { amount: String(product.price), currency: product.currency },
        images: product.images.map((url) => ({ url })),
      },
      { headers: { 'x-tts-access-token': accessToken } },
    )

    if (data.code !== 0) {
      throw new Error(`Failed to create product: ${data.message}`)
    }

    return {
      productId: data.data.product_id,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      images: product.images,
      status: 'ACTIVATE',
    }
  }

  async getOrders(accessToken: string, params?: {
    page?: number
    pageSize?: number
    status?: string
    startTime?: number
    endTime?: number
  }): Promise<{ orders: Array<Record<string, unknown>>; total: number }> {
    const { data } = await axios.get<{
      code: number
      message: string
      data: { orders: Array<Record<string, unknown>>; total: number }
    }>(`${this.baseUrl}/order/search`, {
      headers: { 'x-tts-access-token': accessToken },
      params: {
        page_number: params?.page || 1,
        page_size: params?.pageSize || 20,
        order_status: params?.status,
        create_time_from: params?.startTime,
        create_time_to: params?.endTime,
      },
    })

    if (data.code !== 0) {
      throw new Error(`Failed to get orders: ${data.message}`)
    }

    return {
      orders: data.data.orders || [],
      total: data.data.total || 0,
    }
  }

  async getOrderDetail(accessToken: string, orderId: string): Promise<Record<string, unknown>> {
    const { data } = await axios.get<{
      code: number
      message: string
      data: { order: Record<string, unknown> }
    }>(`${this.baseUrl}/order/detail/query`, {
      headers: { 'x-tts-access-token': accessToken },
      params: { order_id: orderId },
    })

    if (data.code !== 0) {
      throw new Error(`Failed to get order detail: ${data.message}`)
    }

    return data.data.order
  }

  async publishContent(accessToken: string, data: {
    title: string
    description: string
    videoUrl?: string
    images?: string[]
    productIds?: string[]
  }): Promise<{ postId: string; permalink: string }> {
    const requestBody: Record<string, unknown> = {
      title: data.title,
      description: data.description,
    }

    if (data.videoUrl) {
      requestBody.video_url = data.videoUrl
    }
    if (data.images?.length) {
      requestBody.images = data.images.map((url) => ({ url }))
    }
    if (data.productIds?.length) {
      requestBody.product_ids = data.productIds
    }

    const { data: responseData } = await axios.post<{
      code: number
      message: string
      data: { post_id: string; share_url: string }
    }>(
      `${this.baseUrl}/post/publish`,
      requestBody,
      { headers: { 'x-tts-access-token': accessToken } },
    )

    if (responseData.code !== 0) {
      throw new Error(`Failed to publish content: ${responseData.message}`)
    }

    return {
      postId: responseData.data.post_id,
      permalink: responseData.data.share_url,
    }
  }

  async getVideoList(accessToken: string, maxCount = 50): Promise<Array<Record<string, unknown>>> {
    const { data } = await axios.get<{
      code: number
      message: string
      data: { videos: Array<Record<string, unknown>>; cursor: number; has_more: boolean }
    }>(`${this.baseUrl}/video/list/`, {
      headers: { 'x-tts-access-token': accessToken },
      params: { max_count: maxCount },
    })

    if (data.code !== 0) {
      throw new Error(`Failed to get video list: ${data.message}`)
    }

    return data.data.videos || []
  }

  async getVideoInsights(accessToken: string, videoIds: string[]): Promise<Array<{
    videoId: string
    views: number
    likes: number
    comments: number
    shares: number
  }>> {
    const { data } = await axios.post<{
      code: number
      message: string
      data: {
        videos: Array<{
          id: string
          like_count: number
          comment_count: number
          share_count: number
          view_count: number
        }>
      }
    }>(
      `${this.baseUrl}/video/query/`,
      {
        filters: { video_ids: videoIds },
        fields: ['like_count', 'comment_count', 'share_count', 'view_count'],
      },
      { headers: { 'x-tts-access-token': accessToken } },
    )

    if (data.code !== 0) {
      return videoIds.map((id) => ({ videoId: id, views: 0, likes: 0, comments: 0, shares: 0 }))
    }

    return (data.data.videos || []).map((v) => ({
      videoId: v.id,
      views: v.view_count || 0,
      likes: v.like_count || 0,
      comments: v.comment_count || 0,
      shares: v.share_count || 0,
    }))
  }
}
