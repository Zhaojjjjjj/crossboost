import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../base.entity'
import { Product } from './product.entity'

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string

  @ManyToOne(() => Product, (p) => p.images)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @Column({ length: 512 })
  url: string

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number

  @Column({ name: 'is_main', type: 'boolean', default: false })
  isMain: boolean
}
