import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const UploadImagesDtoSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(20).describe('Image URLs to add to the product'),
})
export class UploadImagesDto extends createZodDto(UploadImagesDtoSchema, 'UploadImagesDto') {}
