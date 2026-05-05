import { Repository, FindOptionsWhere, FindManyOptions, ObjectLiteral } from 'typeorm'
import { BaseEntity } from './base.entity'

export interface PaginationParams<T> {
  where?: FindOptionsWhere<T>
  page?: number
  pageSize?: number
  order?: Record<string, 'ASC' | 'DESC'>
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async getById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as any })
  }

  async getOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where })
  }

  async list(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options)
  }

  async listWithPagination(params: PaginationParams<T>): Promise<PaginatedResult<T>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const skip = (page - 1) * pageSize

    const order: any = params.order || { created_at: 'DESC' }

    const [items, total] = await this.repository.findAndCount({
      where: params.where,
      skip,
      take: pageSize,
      order,
    })

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as any)
    return this.repository.save(entity)
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const entities = this.repository.create(data as any[])
    return this.repository.save(entities)
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data as any)
    return this.getById(id)
  }

  async updateMany(where: FindOptionsWhere<T>, data: Partial<T>): Promise<number> {
    const result = await this.repository.update(where, data as any)
    return result.affected || 0
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id)
    return (result.affected || 0) > 0
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where })
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where })
    return count > 0
  }
}
