import { Entity, Column, Index } from 'typeorm'
import { BaseEntity } from '../base.entity'

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 100 })
  name: string

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  credits: number

  @Column({ length: 10, default: 'en' })
  locale: string

  @Column({ length: 50, nullable: true })
  timezone: string | null
}
