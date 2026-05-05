import { Module, Global } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

export interface MongodbConfig {
  uri: string
}

@Global()
@Module({})
export class MongodbModule {
  static forRoot(config: MongodbConfig) {
    return {
      module: MongodbModule,
      imports: [MongooseModule.forRoot(config.uri)],
    }
  }
}
