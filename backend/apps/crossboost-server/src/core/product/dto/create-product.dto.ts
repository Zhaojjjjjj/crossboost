import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const CreateProductDtoSchema = z.object({
  name: z.string().min(1).max(255).describe('Product name'),
  description: z.string().max(5000).optional().describe('Product description'),
  sku: z.string().min(1).max(100).describe('Stock Keeping Unit identifier'),
  sellingPoints: z.array(z.string()).optional().describe('Product selling points'),
  tags: z.array(z.string()).optional().describe('Product tags for search'),
  targetMarkets: z.array(z.string()).optional().describe('Target market codes'),
})
export class CreateProductDto extends createZodDto(CreateProductDtoSchema, 'CreateProductDto') {}
