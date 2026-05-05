import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose'

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data)
    return entity.save()
  }

  async findById(id: string, projection?: Record<string, any>): Promise<T | null> {
    return this.model.findById(id, projection).exec()
  }

  async findOne(filter: FilterQuery<T>, projection?: Record<string, any>): Promise<T | null> {
    return this.model.findOne(filter, projection).exec()
  }

  async find(
    filter: FilterQuery<T>,
    options?: {
      projection?: Record<string, any>
      sort?: Record<string, 1 | -1>
      skip?: number
      limit?: number
    },
  ): Promise<T[]> {
    let query = this.model.find(filter, options?.projection)
    if (options?.sort) query = query.sort(options.sort)
    if (options?.skip) query = query.skip(options.skip)
    if (options?.limit) query = query.limit(options.limit)
    return query.exec()
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec()
  }

  async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, update, { new: true }).exec()
  }

  async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<number> {
    const result = await this.model.updateMany(filter, update).exec()
    return result.modifiedCount
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec()
    return result !== null
  }

  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter).exec()
    return result.deletedCount > 0
  }

  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter).exec()
    return result.deletedCount
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec()
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1).exec()
    return count > 0
  }

  async bulkWrite(operations: any[]): Promise<any> {
    return this.model.bulkWrite(operations)
  }
}
