import { Body, Controller, Post } from '@nestjs/common'
import { ImageService, type GenerateImageOptions, type ProductImageContext } from './image.service'

@Controller('ai/image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('generate')
  async generateImage(@Body() body: GenerateImageOptions) {
    return this.imageService.generateImage(body)
  }

  @Post('product')
  async generateProductImage(@Body() body: ProductImageContext) {
    return this.imageService.generateProductImages(body)
  }

  @Post('marketing')
  async generateMarketingVisual(
    @Body()
    body: {
      productName: string
      campaignTheme: string
      targetMarket: string
      dimensions: 'banner' | 'social-square' | 'story'
    },
  ) {
    return this.imageService.generateMarketingVisual(body)
  }

  @Post('edit')
  async editImage(
    @Body()
    body: {
      imageUrl: string
      prompt: string
      maskUrl?: string
      size?: '1024x1024' | '1792x1024' | '1024x1792'
    },
  ) {
    return this.imageService.editImage(body)
  }
}
