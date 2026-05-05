import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../base.entity'
import { User } from './user.entity'
import { Product } from './product.entity'

export enum ContentTaskType {
  VIDEO = 'video',
  IMAGE = 'image',
  COPY = 'copy',
  ADAPTATION = 'adaptation',
}

export enum ContentTaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('content_tasks')
export class ContentTask extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null

  @Column({ type: 'enum', enum: ContentTaskType })
  type: ContentTaskType

  @Column({ type: 'enum', enum: ContentTaskStatus, default: ContentTaskStatus.PENDING })
  status: ContentTaskStatus

  @Column({ length: 50, nullable: true })
  platform: string | null

  @Column({ type: 'json', nullable: true })
  input: Record<string, any> | null

  @Column({ type: 'json', nullable: true })
  result: Record<string, any> | null

  @Column({ type: 'text', nullable: true })
  error: string | null

  @Column({ name: 'credits_used', type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditsUsed: number
}
