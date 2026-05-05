import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const UserProfileVoSchema = z.object({
  id: z.string().describe('User ID'),
  email: z.string().describe('User email'),
  name: z.string().describe('User display name'),
  avatar: z.string().optional().describe('Avatar URL'),
  status: z.string().describe('User status'),
  createdAt: z.date().describe('Account creation date'),
})
export class UserProfileVo extends createZodDto(UserProfileVoSchema, 'UserProfileVo') {}
