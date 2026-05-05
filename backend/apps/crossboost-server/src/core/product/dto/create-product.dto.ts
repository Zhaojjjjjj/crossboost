import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const CreateProductDtoSchema = z.object({
  name: z.string().min(1).max(500).describe('Product name'),
  description: z.string().max(5000).describe('Product description'),
  sku: z.string().min(1).max(100).describe('Stock Keeping Unit identifier'),
  price: z.number().positive().describe('Product price'),
  currency: z.string().length(3).default('USD').describe('ISO 4217 currency code'),
  category: z.string().describe('Product category'),
  tags: z.array(z.string()).default([]).describe('Product tags for search'),
  images: z.array(z.string().url()).default([]).describe('Product image URLs'),
  stock: z.number().int().min(0).default(0).describe('Available stock quantity'),
  weight: z.number().positive().optional().describe('Product weight in grams'),
  dimensions: z.object({
    length: z.number().positive().describe('Length in cm'),
    width: z.number().positive().describe('Width in cm'),
    height: z.number().positive().describe('Height in cm'),
  }).optional().describe('Product dimensions'),
  metadata: z.record(z.string(), z.unknown()).default({}).describe('Additional metadata'),
})
export class CreateProductDto extends createZodDto(CreateProductDtoSchema, 'CreateProductDto') {}
