import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProductService } from './product.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test } from '@nestjs/testing'
import { Product, ProductImage, ProductStatus } from '@crossboost/database'

describe('ProductService', () => {
  let service: ProductService
  let mockProductRepo: any
  let mockProductImageRepo: any

  beforeEach(async () => {
    mockProductRepo = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      findAndCount: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    }
    mockProductImageRepo = {
      create: vi.fn(),
      save: vi.fn(),
    }

    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(ProductImage), useValue: mockProductImageRepo },
      ],
    }).compile()

    service = module.get<ProductService>(ProductService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create a product', async () => {
    const productData = {
      name: 'Test Product',
      description: 'A test product',
      sku: 'SKU-001',
      tags: ['test'],
    }

    mockProductRepo.create.mockImplementation((data) => data)
    mockProductRepo.save.mockImplementation(async (data) => ({ id: 'prod-1', ...data }))

    const result = await service.create('user-1', productData)
    expect(result.name).toBe('Test Product')
    expect(result.userId).toBe('user-1')
    expect(result.sku).toBe('SKU-001')
    expect(result.id).toBe('prod-1')
  })

  it('should list products with defaults', async () => {
    mockProductRepo.findAndCount.mockResolvedValue([[], 0])

    const result = await service.list('user-1', {})
    expect(result.items).toEqual([])
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.totalPages).toBe(0)
  })

  it('should list products with custom pagination', async () => {
    mockProductRepo.findAndCount.mockResolvedValue([[], 0])

    const result = await service.list('user-1', { page: 2, pageSize: 10 })
    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(10)
  })

  it('should throw on getById for non-existent product', async () => {
    mockProductRepo.findOne.mockResolvedValue(null)
    await expect(service.getById('nonexistent', 'user-1')).rejects.toThrow()
  })

  it('should default product status to draft', async () => {
    mockProductRepo.create.mockImplementation((data) => data)
    mockProductRepo.save.mockImplementation(async (data) => ({ id: 'prod-2', ...data }))

    const result = await service.create('user-1', { name: 'Draft Product', sku: 'SKU-002' })
    expect(result.status).toBe(ProductStatus.DRAFT)
  })
})
