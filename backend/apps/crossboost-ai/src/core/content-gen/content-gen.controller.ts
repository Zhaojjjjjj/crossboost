import { Body, Controller, Post } from '@nestjs/common'
import { ContentGenService, type ContentGenPipelineInput } from './content-gen.service'

@Controller('content-gen')
export class ContentGenController {
  constructor(private readonly contentGenService: ContentGenService) {}

  @Post('pipeline')
  async runPipeline(@Body() body: ContentGenPipelineInput) {
    return this.contentGenService.runPipeline(body)
  }

  @Post('listing')
  async generateListing(
    @Body()
    body: {
      productName: string
      productFeatures: string[]
      targetLanguage: string
      targetMarket: string
      platform: string
      tone?: string
      maxLength?: number
    },
  ) {
    return this.contentGenService.generateListing(body)
  }

  @Post('translate')
  async translateListing(
    @Body()
    body: {
      listing: { title: string; bulletPoints: string[]; description: string }
      targetLanguage: string
      targetMarket: string
    },
  ) {
    return this.contentGenService.translateListing(
      body.listing,
      body.targetLanguage,
      body.targetMarket,
    )
  }
}
