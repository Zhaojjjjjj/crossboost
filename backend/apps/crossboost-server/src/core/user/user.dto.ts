import { createZodDto } from '@crossboost/common'
import { z } from 'zod'

export const RegisterDtoSchema = z.object({
  email: z.string().email().describe('User email address'),
  password: z.string().min(8).max(128).describe('User password (min 8 characters)'),
  name: z.string().min(1).max(100).describe('User display name'),
})
export class RegisterDto extends createZodDto(RegisterDtoSchema, 'RegisterDto') {}

export const LoginDtoSchema = z.object({
  email: z.string().email().describe('User email address'),
  password: z.string().describe('User password'),
})
export class LoginDto extends createZodDto(LoginDtoSchema, 'LoginDto') {}

export const UpdateProfileDtoSchema = z.object({
  name: z.string().min(1).max(100).optional().describe('User display name'),
  avatar: z.string().url().optional().describe('Avatar image URL'),
})
export class UpdateProfileDto extends createZodDto(UpdateProfileDtoSchema, 'UpdateProfileDto') {}
