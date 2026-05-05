import { Module, Global } from '@nestjs/common'
import { AssetsService } from './assets.service'

export interface AssetsConfig {
  provider: 's3' | 'oss' | 'local'
  bucket: string
  region?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
  cdnDomain?: string
  basePath?: string
}

@Global()
@Module({})
export class AssetsModule {
  static forRoot(config: AssetsConfig) {
    return {
      module: AssetsModule,
      providers: [
        AssetsService,
        { provide: 'ASSETS_CONFIG', useValue: config },
      ],
      exports: [AssetsService],
    }
  }
}
