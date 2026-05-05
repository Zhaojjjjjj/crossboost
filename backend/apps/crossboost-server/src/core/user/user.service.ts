import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@crossboost/common'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  passwordHash: string
  status: 'active' | 'disabled'
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  status: string
  createdAt: Date
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  async register(email: string, password: string, name: string): Promise<UserProfile> {
    const existing = await this.getByEmail(email)
    if (existing) {
      throw new AppException(ResponseCode.InvalidParam, { message: 'Email already registered' })
    }

    const user: User = {
      id: this.generateId(),
      email,
      name,
      passwordHash: this.hashPassword(password),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.logger.log(`User registered: ${email}`)
    return this.toProfile(user)
  }

  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const user = await this.getByEmail(email)
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
    const user = await this.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.NotFound, { message: 'User not found' })
    }
    return this.toProfile(user)
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }): Promise<UserProfile> {
    const user = await this.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.NotFound, { message: 'User not found' })
    }

    const updated = {
      ...user,
      ...data,
      updatedAt: new Date(),
    }

    this.logger.log(`User profile updated: ${userId}`)
    return this.toProfile(updated)
  }

  private async getByEmail(_email: string): Promise<User | null> {
    // Repository call placeholder
    return null
  }

  private async getById(_id: string): Promise<User | null> {
    // Repository call placeholder
    return null
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
    }
  }

  private generateId(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
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
