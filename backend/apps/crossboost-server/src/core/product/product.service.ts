import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, In } from 'typeorm'
import { AppException, ResponseCode } from '@crossboost/common'
import { Product, ProductStatus, ProductImage } from '@crossboost/database'

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

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
  ) {}

  async create(userId: string, data: {
    name: string
    description?: string
    sku: string
    sellingPoints?: string[]
    tags?: string[]
    targetMarkets?: string[]
    status?: ProductStatus
  }): Promise<Product> {
    const entity = this.productRepo.create({
      userId,
      name: data.name,
      description: data.description ?? null,
      sku: data.sku,
      sellingPoints: data.sellingPoints ?? null,
      tags: data.tags ?? null,
      targetMarkets: data.targetMarkets ?? null,
      status: data.status ?? ProductStatus.DRAFT,
    })

    const product = await this.productRepo.save(entity)
    this.logger.log(`Product created: ${product.name} (${product.sku})`)
    return product
  }

  async list(
    userId: string,
    query: { page?: number; pageSize?: number; status?: ProductStatus; search?: string },
  ): Promise<ProductListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = { userId }
    if (query.status) {
      where.status = query.status
    }
    if (query.search) {
      where.name = Like(`%${query.search}%`)
    }

    const [items, total] = await this.productRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })

    this.logger.log(`Listing products for user: ${userId}, page: ${page}`)
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async getById(id: string, userId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, userId },
      relations: ['images'],
    })
    if (!product) {
      throw new AppException(ResponseCode.ProductNotFound, { message: 'Product not found' })
    }
    return product
  }

  async update(id: string, userId: string, data: Partial<{
    name: string
    description: string
    sku: string
    sellingPoints: string[]
    tags: string[]
    targetMarkets: string[]
    status: ProductStatus
  }>): Promise<Product> {
    const product = await this.getById(id, userId)
    await this.productRepo.update(product.id, data)
    const updated = await this.productRepo.findOne({
      where: { id: product.id },
      relations: ['images'],
    })
    this.logger.log(`Product updated: ${id}`)
    return updated!
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const product = await this.getById(id, userId)
    await this.productRepo.softDelete(product.id)
    this.logger.log(`Product soft-deleted: ${id}`)
  }

  async uploadImages(id: string, userId: string, imageUrls: string[]): Promise<Product> {
    const product = await this.getById(id, userId)

    const images = imageUrls.map((url, index) =>
      this.productImageRepo.create({
        productId: product.id,
        url,
        sortOrder: index,
        isMain: index === 0,
      }),
    )

    await this.productImageRepo.save(images)
    this.logger.log(`Images uploaded for product: ${id}`)

    return this.productRepo.findOne({
      where: { id: product.id },
      relations: ['images'],
    }) as Promise<Product>
  }
}
