import { Body, Controller, Get, Patch, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@crossboost/common'
import { RegisterDto, RegisterDtoSchema } from './user.dto'
import { LoginDto, LoginDtoSchema } from './user.dto'
import { UpdateProfileDto, UpdateProfileDtoSchema } from './user.dto'
import { UserProfileVo } from './user.vo'
import { UserService } from './user.service'

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiDoc({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
    body: RegisterDtoSchema,
    response: UserProfileVo,
  })
  @Post('/register')
  async register(@Body() body: RegisterDto) {
    return this.userService.register(body.email, body.password, body.name)
  }

  @ApiDoc({
    summary: 'User login',
    description: 'Authenticate user with email and password',
    body: LoginDtoSchema,
  })
  @Post('/login')
  async login(@Body() body: LoginDto) {
    return this.userService.login(body.email, body.password)
  }

  @ApiDoc({
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user profile',
    response: UserProfileVo,
  })
  @Get('/profile')
  async getProfile() {
    // In production, extract userId from JWT token
    const userId = 'current-user-id'
    return this.userService.getProfile(userId)
  }

  @ApiDoc({
    summary: 'Update user profile',
    description: 'Update the authenticated user profile',
    body: UpdateProfileDtoSchema,
    response: UserProfileVo,
  })
  @Patch('/profile')
  async updateProfile(@Body() body: UpdateProfileDto) {
    const userId = 'current-user-id'
    return this.userService.updateProfile(userId, body)
  }
}
