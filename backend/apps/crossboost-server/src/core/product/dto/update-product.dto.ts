import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const UpdateProductDtoSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Product name'),
  description: z.string().max(5000).optional().describe('Product description'),
  sku: z.string().min(1).max(100).optional().describe('Stock Keeping Unit identifier'),
  sellingPoints: z.array(z.string()).optional().describe('Product selling points'),
  tags: z.array(z.string()).optional().describe('Product tags'),
  targetMarkets: z.array(z.string()).optional().describe('Target market codes'),
  status: z.enum(['draft', 'active', 'archived']).optional().describe('Product status'),
})
export class UpdateProductDto extends createZodDto(UpdateProductDtoSchema, 'UpdateProductDto') {}
