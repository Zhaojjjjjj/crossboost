import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@crossboost/common'

export interface Product {
  id: string
  userId: string
  name: string
  description: string
  sku: string
  price: number
  currency: string
  category: string
  tags: string[]
  images: string[]
  status: 'draft' | 'active' | 'archived'
  stock: number
  weight?: number
  dimensions?: { length: number; width: number; height: number }
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface ProductListResult {
  items: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)

  async create(userId: string, data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Product> {
    const product: Product = {
      id: this.generateId(),
      userId,
      ...data,
      status: data.status ?? 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.logger.log(`Product created: ${product.name} (${product.sku})`)
    return product
  }

  async list(
    userId: string,
    query: { page?: number; pageSize?: number; status?: string; category?: string; search?: string },
  ): Promise<ProductListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    this.logger.log(`Listing products for user: ${userId}, page: ${page}`)
    // Repository call placeholder
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }

  async getById(id: string, userId: string): Promise<Product> {
    // Repository call placeholder
    throw new AppException(ResponseCode.ProductNotFound, { message: 'Product not found' })
  }

  async update(id: string, userId: string, data: Partial<Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    const product = await this.getById(id, userId)
    if (product.userId !== userId) {
      throw new AppException(ResponseCode.ProductNotFound, { message: 'Product not found' })
    }

    const updated = {
      ...product,
      ...data,
      updatedAt: new Date(),
    }

    this.logger.log(`Product updated: ${id}`)
    return updated
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const product = await this.getById(id, userId)
    if (product.userId !== userId) {
      throw new AppException(ResponseCode.ProductNotFound, { message: 'Product not found' })
    }

    this.logger.log(`Product soft-deleted: ${id}`)
  }

  async uploadImages(id: string, userId: string, imageUrls: string[]): Promise<Product> {
    const product = await this.getById(id, userId)
    if (product.userId !== userId) {
      throw new AppException(ResponseCode.ProductNotFound, { message: 'Product not found' })
    }

    const updated = {
      ...product,
      images: [...product.images, ...imageUrls],
      updatedAt: new Date(),
    }

    this.logger.log(`Images uploaded for product: ${id}`)
    return updated
  }

  private generateId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}
