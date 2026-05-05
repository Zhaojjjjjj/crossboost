import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AppException, ResponseCode } from '@crossboost/common'
import { User, UserStatus } from '@crossboost/database'

export interface UserProfile {
  id: string
  email: string
  name: string
  status: UserStatus
  credits: number
  locale: string
  timezone: string | null
  createdAt: Date
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(email: string, password: string, name: string): Promise<UserProfile> {
    const existing = await this.userRepo.findOne({ where: { email } })
    if (existing) {
      throw new AppException(ResponseCode.InvalidParam, { message: 'Email already registered' })
    }

    const entity = this.userRepo.create({
      email,
      name,
      passwordHash: this.hashPassword(password),
      status: UserStatus.ACTIVE,
    })

    const user = await this.userRepo.save(entity)
    this.logger.log(`User registered: ${email}`)
    return this.toProfile(user)
  }

  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const user = await this.userRepo.findOne({ where: { email } })
    if (!user) {
      throw new AppException(ResponseCode.Unauthorized, { message: 'Invalid credentials' })
    }

    if (!this.verifyPassword(password, user.passwordHash)) {
      throw new AppException(ResponseCode.Unauthorized, { message: 'Invalid credentials' })
    }

    const token = this.generateToken(user.id)
    this.logger.log(`User logged in: ${email}`)
    return { user: this.toProfile(user), token }
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) {
      throw new AppException(ResponseCode.NotFound, { message: 'User not found' })
    }
    return this.toProfile(user)
  }

  async getById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } })
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } })
  }

  async updateProfile(userId: string, data: { name?: string; timezone?: string; locale?: string }): Promise<UserProfile> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) {
      throw new AppException(ResponseCode.NotFound, { message: 'User not found' })
    }

    await this.userRepo.update(userId, data)
    const updated = await this.userRepo.findOne({ where: { id: userId } })
    this.logger.log(`User profile updated: ${userId}`)
    return this.toProfile(updated!)
  }

  async updateCredits(userId: string, amount: number): Promise<void> {
    await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ credits: () => `credits + ${amount}` })
      .where('id = :id', { id: userId })
      .execute()
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      credits: Number(user.credits),
      locale: user.locale,
      timezone: user.timezone,
      createdAt: user.createdAt,
    }
  }

  private hashPassword(password: string): string {
    // Placeholder - use bcrypt in production
    return Buffer.from(password).toString('base64')
  }

  private verifyPassword(password: string, hash: string): boolean {
    return Buffer.from(password).toString('base64') === hash
  }

  private generateToken(userId: string): string {
    // Placeholder - use JWT in production
    return Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64')
  }
}
