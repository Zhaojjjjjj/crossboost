import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@crossboost/common'
import { CreateProductDto, CreateProductDtoSchema } from './dto/create-product.dto'
import { ListProductsDto, ListProductsDtoSchema } from './dto/list-products.dto'
import { UpdateProductDto, UpdateProductDtoSchema } from './dto/update-product.dto'
import { UploadImagesDto, UploadImagesDtoSchema } from './dto/upload-images.dto'
import { ProductService } from './product.service'

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiDoc({
    summary: 'Create a product',
    description: 'Create a new product for cross-border e-commerce',
    body: CreateProductDtoSchema,
  })
  @Post('/')
  async createProduct(@Body() body: CreateProductDto) {
    const userId = 'current-user-id'
    return this.productService.create(userId, body)
  }

  @ApiDoc({
    summary: 'List products',
    description: 'List products with pagination and filters',
    query: ListProductsDtoSchema,
  })
  @Get('/')
  async listProducts(@Query() query: ListProductsDto) {
    const userId = 'current-user-id'
    return this.productService.list(userId, query)
  }

  @ApiDoc({
    summary: 'Get product detail',
    description: 'Get a single product by ID',
  })
  @Get('/:id')
  async getProduct(@Param('id') id: string) {
    const userId = 'current-user-id'
    return this.productService.getById(id, userId)
  }

  @ApiDoc({
    summary: 'Update a product',
    description: 'Update product details',
    body: UpdateProductDtoSchema,
  })
  @Patch('/:id')
  async updateProduct(@Param('id') id: string, @Body() body: UpdateProductDto) {
    const userId = 'current-user-id'
    return this.productService.update(id, userId, body)
  }

  @ApiDoc({
    summary: 'Soft delete a product',
    description: 'Mark a product as deleted without removing it',
  })
  @Delete('/:id')
  async deleteProduct(@Param('id') id: string) {
    const userId = 'current-user-id'
    await this.productService.softDelete(id, userId)
  }

  @ApiDoc({
    summary: 'Upload product images',
    description: 'Add images to an existing product',
    body: UploadImagesDtoSchema,
  })
  @Post('/:id/images')
  async uploadImages(@Param('id') id: string, @Body() body: UploadImagesDto) {
    const userId = 'current-user-id'
    return this.productService.uploadImages(id, userId, body.imageUrls)
  }
}
