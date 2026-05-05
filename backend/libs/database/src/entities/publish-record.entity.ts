import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../base.entity'
import { User } from './user.entity'
import { Account } from './account.entity'
import { ContentTask } from './content-task.entity'

export enum PublishStatus {
  PENDING = 'pending',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('publish_records')
export class PublishRecord extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'content_id', type: 'uuid', nullable: true })
  contentId: string | null

  @ManyToOne(() => ContentTask, { nullable: true })
  @JoinColumn({ name: 'content_id' })
  content: ContentTask | null

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account

  @Column({ length: 50 })
  platform: string

  @Column({ type: 'enum', enum: PublishStatus, default: PublishStatus.PENDING })
  status: PublishStatus

  @Column({ name: 'platform_post_id', length: 255, nullable: true })
  platformPostId: string | null

  @Column({ name: 'platform_url', length: 512, nullable: true })
  platformUrl: string | null

  @Column({ type: 'text', nullable: true })
  caption: string | null

  @Column({ type: 'json', nullable: true })
  media: Record<string, any> | null

  @Column({ type: 'text', nullable: true })
  error: string | null

  @Column({ name: 'scheduled_at', type: 'datetime', nullable: true })
  scheduledAt: Date | null

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt: Date | null
}
