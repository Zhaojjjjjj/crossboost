import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { BaseEntity } from '../base.entity'
import { User } from './user.entity'
import { ProductImage } from './product-image.entity'

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('products')
export class Product extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ length: 255 })
  name: string

  @Index()
  @Column({ length: 100 })
  sku: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'selling_points', type: 'json', nullable: true })
  sellingPoints: string[] | null

  @Column({ type: 'json', nullable: true })
  tags: string[] | null

  @Column({ name: 'target_markets', type: 'json', nullable: true })
  targetMarkets: string[] | null

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus

  @OneToMany(() => ProductImage, (img) => img.product)
  images: ProductImage[]
}
