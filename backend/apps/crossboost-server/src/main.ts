import 'dotenv/config'
import { startApplication } from '@crossboost/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { config } from './config'

startApplication(AppModule, config, {
  setupApp: (app) => {
    app.enableCors()

    const swaggerConfig = new DocumentBuilder()
      .setTitle('CrossBoost API')
      .setDescription('AI-Powered Cross-Border E-Commerce Content Marketing Platform')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
  },
})
