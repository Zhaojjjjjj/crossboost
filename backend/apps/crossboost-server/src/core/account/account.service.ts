import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@crossboost/common'

export type PlatformType = 'tiktok_shop' | 'instagram' | 'pinterest' | 'youtube'

export interface PlatformAccount {
  id: string
  userId: string
  platform: PlatformType
  platformAccountId: string
  accountName: string
  avatar?: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
  status: 'connected' | 'expired' | 'disconnected'
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name)

  async listByUserId(userId: string): Promise<PlatformAccount[]> {
    this.logger.log(`Listing accounts for user: ${userId}`)
    // Repository call placeholder
    return []
  }

  async getById(id: string, userId: string): Promise<PlatformAccount> {
    // Repository call placeholder
    throw new AppException(ResponseCode.AccountNotFound, { message: 'Account not found' })
  }

  async connect(
    userId: string,
    platform: PlatformType,
    authData: {
      platformAccountId: string
      accountName: string
      avatar?: string
      accessToken: string
      refreshToken?: string
      tokenExpiresAt?: Date
      metadata?: Record<string, unknown>
    },
  ): Promise<PlatformAccount> {
    const account: PlatformAccount = {
      id: this.generateId(),
      userId,
      platform,
      platformAccountId: authData.platformAccountId,
      accountName: authData.accountName,
      avatar: authData.avatar,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      tokenExpiresAt: authData.tokenExpiresAt,
      status: 'connected',
      metadata: authData.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.logger.log(`Account connected: ${platform} - ${authData.accountName}`)
    return account
  }

  async disconnect(id: string, userId: string): Promise<void> {
    const account = await this.getById(id, userId)
    if (account.userId !== userId) {
      throw new AppException(ResponseCode.AccountNotFound, { message: 'Account not found' })
    }

    this.logger.log(`Account disconnected: ${id}`)
  }

  async refreshToken(id: string): Promise<PlatformAccount> {
    const account = await this.getById(id, '')
    if (!account.refreshToken) {
      throw new AppException(ResponseCode.AccountAuthExpired, { message: 'No refresh token available' })
    }

    this.logger.log(`Token refreshed for account: ${id}`)
    return { ...account, updatedAt: new Date() }
  }

  private generateId(): string {
    return `acc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}
