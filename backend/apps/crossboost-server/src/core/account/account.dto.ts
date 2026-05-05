import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const ConnectAccountDtoSchema = z.object({
  platform: z.enum(['tiktok_shop', 'tiktok', 'instagram', 'pinterest', 'youtube', 'facebook']).describe('Platform type'),
  platformAccountId: z.string().describe('Platform-specific account ID'),
  accountName: z.string().describe('Account display name'),
  avatar: z.string().url().optional().describe('Account avatar URL'),
  accessToken: z.string().describe('OAuth access token'),
  refreshToken: z.string().optional().describe('OAuth refresh token'),
  tokenExpiresAt: z.coerce.date().optional().describe('Token expiration time'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Additional platform metadata'),
})
export class ConnectAccountDto extends createZodDto(ConnectAccountDtoSchema, 'ConnectAccountDto') {}
