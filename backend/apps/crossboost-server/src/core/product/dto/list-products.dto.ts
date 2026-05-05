import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const ListProductsDtoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).describe('Items per page'),
  status: z.enum(['draft', 'active', 'archived']).optional().describe('Filter by status'),
  category: z.string().optional().describe('Filter by category'),
  search: z.string().optional().describe('Search term for name/description'),
})
export class ListProductsDto extends createZodDto(ListProductsDtoSchema, 'ListProductsDto') {}
