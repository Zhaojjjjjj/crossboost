import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const UserProfileVoSchema = z.object({
  id: z.string().uuid().describe('User ID'),
  email: z.string().describe('User email'),
  name: z.string().describe('User display name'),
  status: z.string().describe('User status'),
  credits: z.number().describe('Credit balance'),
  locale: z.string().describe('User locale'),
  timezone: z.string().nullable().describe('User timezone'),
  createdAt: z.date().describe('Account creation date'),
})
export class UserProfileVo extends createZodDto(UserProfileVoSchema, 'UserProfileVo') {}
