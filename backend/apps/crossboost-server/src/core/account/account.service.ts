import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AppException, ResponseCode } from '@crossboost/common'
import { Account, PlatformType } from '@crossboost/database'

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name)

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async listByUserId(userId: string): Promise<Account[]> {
    this.logger.log(`Listing accounts for user: ${userId}`)
    return this.accountRepo.find({ where: { userId } })
  }

  async getById(id: string, userId: string): Promise<Account> {
    const account = await this.accountRepo.findOne({ where: { id, userId } })
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound, { message: 'Account not found' })
    }
    return account
  }

  async connect(
    userId: string,
    platform: PlatformType,
    authData: {
      platformAccountId: string
      displayName: string
      avatarUrl?: string
      accessToken: string
      refreshToken?: string
      expiresAt?: Date
      metadata?: Record<string, unknown>
    },
  ): Promise<Account> {
    const entity = this.accountRepo.create({
      userId,
      platform,
      platformAccountId: authData.platformAccountId,
      displayName: authData.displayName,
      avatarUrl: authData.avatarUrl ?? null,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken ?? null,
      expiresAt: authData.expiresAt ?? null,
      metadata: authData.metadata ?? {},
    })

    const account = await this.accountRepo.save(entity)
    this.logger.log(`Account connected: ${platform} - ${authData.displayName}`)
    return account
  }

  async disconnect(id: string, userId: string): Promise<void> {
    const account = await this.getById(id, userId)
    await this.accountRepo.softDelete(account.id)
    this.logger.log(`Account disconnected: ${id}`)
  }

  async refreshToken(id: string): Promise<Account> {
    const account = await this.accountRepo.findOne({ where: { id } })
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound, { message: 'Account not found' })
    }
    if (!account.refreshToken) {
      throw new AppException(ResponseCode.AccountAuthExpired, { message: 'No refresh token available' })
    }

    // Refresh token logic placeholder - integrate with platform OAuth
    this.logger.log(`Token refreshed for account: ${id}`)
    return account
  }

  async updateTokens(
    id: string,
    data: { accessToken: string; refreshToken?: string; expiresAt?: Date },
  ): Promise<void> {
    await this.accountRepo.update(id, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      expiresAt: data.expiresAt ?? null,
    })
  }
}
