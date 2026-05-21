import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global prefix
  app.setGlobalPrefix('api')

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  })

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Carbon Footprint API')
    .setDescription('Carbon Footprint Management & Traceability — Schema v1.3')
    .setVersion('1.3.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(3000)
  console.log('🌿 Carbon Footprint API running on http://localhost:3000/api')
  console.log('📚 Swagger docs at     http://localhost:3000/api/docs')
}
bootstrap()
