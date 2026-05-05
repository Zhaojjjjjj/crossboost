import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../base.entity'
import { User } from './user.entity'

export enum CreditTransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  REFUND = 'refund',
  BONUS = 'bonus',
}

@Entity('credit_transactions')
export class CreditTransaction extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number

  @Column({ type: 'enum', enum: CreditTransactionType })
  type: CreditTransactionType

  @Column({ length: 255, nullable: true })
  description: string | null

  @Column({ name: 'balance_after', type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number

  @Column({ name: 'reference_id', length: 255, nullable: true })
  referenceId: string | null
}
