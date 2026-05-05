import { Injectable, Logger } from '@nestjs/common'

export interface TikTokShopProduct {
  productId: string
  title: string
  description: string
  price: number
  currency: string
  images: string[]
  status: string
}

@Injectable()
export class TikTokShopService {
  private readonly logger = new Logger(TikTokShopService.name)

  async getAuthUrl(redirectUri: string): Promise<string> {
    this.logger.log(`Generating TikTok Shop auth URL, redirect: ${redirectUri}`)
    return `https://auth.tiktok-shops.com/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    this.logger.log('Exchanging TikTok Shop auth code')
    return { accessToken: '', refreshToken: '', expiresIn: 0 }
  }

  async getShopInfo(accessToken: string): Promise<{ shopId: string; shopName: string; region: string }> {
    this.logger.log('Getting TikTok Shop info')
    return { shopId: '', shopName: '', region: '' }
  }

  async syncProducts(accessToken: string, shopId: string): Promise<TikTokShopProduct[]> {
    this.logger.log(`Syncing products from TikTok Shop: ${shopId}`)
    return []
  }

  async publishContent(accessToken: string, data: {
    shopId: string
    title: string
    description: string
    videoUrl?: string
    images?: string[]
    productIds?: string[]
  }): Promise<{ postId: string; permalink: string }> {
    this.logger.log(`Publishing content to TikTok Shop: ${data.shopId}`)
    return { postId: '', permalink: '' }
  }
}
