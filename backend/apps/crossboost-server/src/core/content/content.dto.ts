import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const CreateContentDtoSchema = z.object({
  type: z.enum(['video', 'image', 'copy', 'adaptation']).describe('Content task type'),
  platform: z.string().optional().describe('Target platform'),
  productId: z.string().uuid().optional().describe('Related product ID'),
  input: z.record(z.string(), z.unknown()).optional().describe('Task input parameters'),
})
export class CreateContentDto extends createZodDto(CreateContentDtoSchema, 'CreateContentDto') {}

export const ListContentDtoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).describe('Items per page'),
  type: z.enum(['video', 'image', 'copy', 'adaptation']).optional().describe('Filter by type'),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional().describe('Filter by status'),
  platform: z.string().optional().describe('Filter by platform'),
})
export class ListContentDto extends createZodDto(ListContentDtoSchema, 'ListContentDto') {}

export const UpdateContentDtoSchema = z.object({
  type: z.enum(['video', 'image', 'copy', 'adaptation']).optional().describe('Content task type'),
  platform: z.string().optional().describe('Target platform'),
  input: z.record(z.string(), z.unknown()).optional().describe('Task input parameters'),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional().describe('Task status'),
  result: z.record(z.string(), z.unknown()).optional().describe('Task result'),
  error: z.string().optional().describe('Error message'),
  creditsUsed: z.number().optional().describe('Credits used'),
})
export class UpdateContentDto extends createZodDto(UpdateContentDtoSchema, 'UpdateContentDto') {}
