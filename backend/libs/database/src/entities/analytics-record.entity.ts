import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../base.entity'
import { PublishRecord } from './publish-record.entity'

@Entity('analytics_records')
export class AnalyticsRecord extends BaseEntity {
  @Index()
  @Column({ name: 'publish_record_id', type: 'uuid' })
  publishRecordId: string

  @ManyToOne(() => PublishRecord)
  @JoinColumn({ name: 'publish_record_id' })
  publishRecord: PublishRecord

  @Column({ length: 50 })
  platform: string

  @Column({ type: 'int', default: 0 })
  views: number

  @Column({ type: 'int', default: 0 })
  likes: number

  @Column({ type: 'int', default: 0 })
  comments: number

  @Column({ type: 'int', default: 0 })
  shares: number

  @Column({ type: 'int', default: 0 })
  saves: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  revenue: number

  @Column({ type: 'int', default: 0 })
  clicks: number

  @Column({ name: 'recorded_at', type: 'datetime' })
  recordedAt: Date
}
