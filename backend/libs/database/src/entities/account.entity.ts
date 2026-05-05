import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../base.entity'
import { User } from './user.entity'

export enum PlatformType {
  TikTokShop = 'tiktok_shop',
  TikTok = 'tiktok',
  Instagram = 'instagram',
  Pinterest = 'pinterest',
  YouTube = 'youtube',
  Facebook = 'facebook',
}

@Entity('accounts')
export class Account extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'enum', enum: PlatformType })
  platform: PlatformType

  @Column({ name: 'platform_account_id', length: 255 })
  platformAccountId: string

  @Column({ name: 'platform_username', length: 255, nullable: true })
  platformUsername: string | null

  @Column({ name: 'display_name', length: 255, nullable: true })
  displayName: string | null

  @Column({ name: 'avatar_url', length: 512, nullable: true })
  avatarUrl: string | null

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken: string | null

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null

  @Column({ type: 'int', default: 0 })
  followers: number

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null
}
