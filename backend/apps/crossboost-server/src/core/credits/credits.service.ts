import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AppException, ResponseCode } from '@crossboost/common'
import { CreditTransaction, CreditTransactionType, User } from '@crossboost/database'

export interface CreditBalance {
  userId: string
  balance: number
  updatedAt: Date
}

export interface TransactionListResult {
  items: CreditTransaction[]
  total: number
  page: number
  pageSize: number
}

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name)

  constructor(
    @InjectRepository(CreditTransaction)
    private readonly transactionRepo: Repository<CreditTransaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getBalance(userId: string): Promise<CreditBalance> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) {
      throw new AppException(ResponseCode.NotFound, { message: 'User not found' })
    }

    this.logger.log(`Getting credit balance for user: ${userId}`)
    return {
      userId,
      balance: Number(user.credits),
      updatedAt: user.updatedAt,
    }
  }

  async addCredits(userId: string, amount: number, description: string, referenceId?: string): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new AppException(ResponseCode.InvalidParam, { message: 'Amount must be positive' })
    }

    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) {
      throw new AppException(ResponseCode.NotFound, { message: 'User not found' })
    }

    // Update user credits atomically
    await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ credits: () => `credits + ${amount}` })
      .where('id = :id', { id: userId })
      .execute()

    const updatedUser = await this.userRepo.findOne({ where: { id: userId } })

    const transaction = this.transactionRepo.create({
      userId,
      amount,
      type: CreditTransactionType.PURCHASE,
      description,
      referenceId: referenceId ?? null,
      balanceAfter: Number(updatedUser!.credits),
    })

    const saved = await this.transactionRepo.save(transaction)
    this.logger.log(`Credits added: ${amount} for user: ${userId}`)
    return saved
  }

  async deductCredits(userId: string, amount: number, description: string, referenceId?: string): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new AppException(ResponseCode.InvalidParam, { message: 'Amount must be positive' })
    }

    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) {
      throw new AppException(ResponseCode.NotFound, { message: 'User not found' })
    }

    if (Number(user.credits) < amount) {
      throw new AppException(ResponseCode.InvalidParam, { message: 'Insufficient credits' })
    }

    // Update user credits atomically
    await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ credits: () => `credits - ${amount}` })
      .where('id = :id', { id: userId })
      .execute()

    const updatedUser = await this.userRepo.findOne({ where: { id: userId } })

    const transaction = this.transactionRepo.create({
      userId,
      amount: -amount,
      type: CreditTransactionType.USAGE,
      description,
      referenceId: referenceId ?? null,
      balanceAfter: Number(updatedUser!.credits),
    })

    const saved = await this.transactionRepo.save(transaction)
    this.logger.log(`Credits deducted: ${amount} for user: ${userId}`)
    return saved
  }

  async getTransactions(userId: string, query: { page?: number; pageSize?: number; type?: CreditTransactionType }): Promise<TransactionListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = { userId }
    if (query.type) where.type = query.type

    const [items, total] = await this.transactionRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })

    this.logger.log(`Getting transactions for user: ${userId}`)
    return {
      items,
      total,
      page,
      pageSize,
    }
  }
}
