import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@crossboost/common'

export interface CreditBalance {
  userId: string
  balance: number
  currency: string
  updatedAt: Date
}

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  description: string
  referenceId?: string
  balanceAfter: number
  createdAt: Date
}

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name)

  async getBalance(userId: string): Promise<CreditBalance> {
    this.logger.log(`Getting credit balance for user: ${userId}`)
    // Repository call placeholder
    return {
      userId,
      balance: 0,
      currency: 'USD',
      updatedAt: new Date(),
    }
  }

  async addCredits(userId: string, amount: number, description: string, referenceId?: string): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new AppException(ResponseCode.InvalidParam, { message: 'Amount must be positive' })
    }

    const balance = await this.getBalance(userId)
    const newBalance = balance.balance + amount

    const transaction: CreditTransaction = {
      id: this.generateId(),
      userId,
      amount,
      type: 'purchase',
      description,
      referenceId,
      balanceAfter: newBalance,
      createdAt: new Date(),
    }

    this.logger.log(`Credits added: ${amount} for user: ${userId}`)
    return transaction
  }

  async deductCredits(userId: string, amount: number, description: string, referenceId?: string): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new AppException(ResponseCode.InvalidParam, { message: 'Amount must be positive' })
    }

    const balance = await this.getBalance(userId)
    if (balance.balance < amount) {
      throw new AppException(ResponseCode.InvalidParam, { message: 'Insufficient credits' })
    }

    const newBalance = balance.balance - amount

    const transaction: CreditTransaction = {
      id: this.generateId(),
      userId,
      amount: -amount,
      type: 'usage',
      description,
      referenceId,
      balanceAfter: newBalance,
      createdAt: new Date(),
    }

    this.logger.log(`Credits deducted: ${amount} for user: ${userId}`)
    return transaction
  }

  async getTransactions(userId: string, query: { page?: number; pageSize?: number; type?: string }): Promise<{
    items: CreditTransaction[]
    total: number
    page: number
    pageSize: number
  }> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    this.logger.log(`Getting transactions for user: ${userId}`)
    return {
      items: [],
      total: 0,
      page,
      pageSize,
    }
  }

  private generateId(): string {
    return `crd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}
