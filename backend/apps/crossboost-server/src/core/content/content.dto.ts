import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const CreateContentDtoSchema = z.object({
  type: z.enum(['post', 'video', 'image', 'story', 'reel']).describe('Content type'),
  title: z.string().min(1).max(500).describe('Content title'),
  body: z.string().max(10000).describe('Content body text'),
  mediaUrls: z.array(z.string().url()).default([]).describe('Media file URLs'),
  tags: z.array(z.string()).default([]).describe('Content tags'),
  platform: z.string().describe('Target platform'),
  scheduledAt: z.coerce.date().optional().describe('Scheduled publish time'),
  metadata: z.record(z.string(), z.unknown()).default({}).describe('Additional metadata'),
})
export class CreateContentDto extends createZodDto(CreateContentDtoSchema, 'CreateContentDto') {}

export const ListContentDtoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).describe('Items per page'),
  type: z.enum(['post', 'video', 'image', 'story', 'reel']).optional().describe('Filter by type'),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional().describe('Filter by status'),
  platform: z.string().optional().describe('Filter by platform'),
})
export class ListContentDto extends createZodDto(ListContentDtoSchema, 'ListContentDto') {}

export const UpdateContentDtoSchema = z.object({
  title: z.string().min(1).max(500).optional().describe('Content title'),
  body: z.string().max(10000).optional().describe('Content body text'),
  mediaUrls: z.array(z.string().url()).optional().describe('Media file URLs'),
  tags: z.array(z.string()).optional().describe('Content tags'),
  platform: z.string().optional().describe('Target platform'),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional().describe('Content status'),
  scheduledAt: z.coerce.date().optional().describe('Scheduled publish time'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
})
export class UpdateContentDto extends createZodDto(UpdateContentDtoSchema, 'UpdateContentDto') {}
