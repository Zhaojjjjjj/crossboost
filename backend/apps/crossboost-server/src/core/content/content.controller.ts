import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@crossboost/common'
import { CreateContentDto, CreateContentDtoSchema } from './content.dto'
import { ListContentDto, ListContentDtoSchema } from './content.dto'
import { UpdateContentDto, UpdateContentDtoSchema } from './content.dto'
import { ContentService } from './content.service'

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @ApiDoc({
    summary: 'Create content task',
    description: 'Create a new content generation task',
    body: CreateContentDtoSchema,
  })
  @Post('/')
  async createContent(@Body() body: CreateContentDto) {
    const userId = 'current-user-id'
    return this.contentService.create(userId, body)
  }

  @ApiDoc({
    summary: 'List content tasks',
    description: 'List all content tasks with pagination and filters',
    query: ListContentDtoSchema,
  })
  @Get('/')
  async listContent(@Query() query: ListContentDto) {
    const userId = 'current-user-id'
    return this.contentService.list(userId, query)
  }

  @ApiDoc({
    summary: 'Get content task detail',
    description: 'Get a single content task by ID',
  })
  @Get('/:id')
  async getContent(@Param('id') id: string) {
    const userId = 'current-user-id'
    return this.contentService.getById(id, userId)
  }

  @ApiDoc({
    summary: 'Update content task',
    description: 'Update content task details',
    body: UpdateContentDtoSchema,
  })
  @Patch('/:id')
  async updateContent(@Param('id') id: string, @Body() body: UpdateContentDto) {
    const userId = 'current-user-id'
    return this.contentService.update(id, userId, body)
  }

  @ApiDoc({
    summary: 'Delete content task',
    description: 'Soft delete a content task',
  })
  @Delete('/:id')
  async deleteContent(@Param('id') id: string) {
    const userId = 'current-user-id'
    await this.contentService.softDelete(id, userId)
  }
}
