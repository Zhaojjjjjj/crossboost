import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../base.entity'
import { User } from './user.entity'

export enum NotificationType {
  SYSTEM = 'system',
  PUBLISH = 'publish',
  CONTENT = 'content',
  CREDIT = 'credit',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.SYSTEM })
  type: NotificationType

  @Column({ length: 255 })
  title: string

  @Column({ type: 'text' })
  message: string

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean
}
