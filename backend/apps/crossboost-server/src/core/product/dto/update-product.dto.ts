import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const UpdateProductDtoSchema = z.object({
  name: z.string().min(1).max(500).optional().describe('Product name'),
  description: z.string().max(5000).optional().describe('Product description'),
  sku: z.string().min(1).max(100).optional().describe('Stock Keeping Unit identifier'),
  price: z.number().positive().optional().describe('Product price'),
  currency: z.string().length(3).optional().describe('ISO 4217 currency code'),
  category: z.string().optional().describe('Product category'),
  tags: z.array(z.string()).optional().describe('Product tags'),
  images: z.array(z.string().url()).optional().describe('Product image URLs'),
  status: z.enum(['draft', 'active', 'archived']).optional().describe('Product status'),
  stock: z.number().int().min(0).optional().describe('Available stock quantity'),
  weight: z.number().positive().optional().describe('Product weight in grams'),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional().describe('Product dimensions'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
})
export class UpdateProductDto extends createZodDto(UpdateProductDtoSchema, 'UpdateProductDto') {}
