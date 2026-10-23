import 'reflect-metadata'
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'

const isDev = process.env['NODE_ENV'] !== 'production'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false })
  app.setGlobalPrefix('api')
  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({ origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5174', credentials: true })
  app.enableShutdownHooks()
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException(errors.flatMap((e) => Object.values(e.constraints ?? {})).join('. ') || 'Datos inválidos'),
    }),
  )

  if (isDev) {
    const config = new DocumentBuilder().setTitle('Borrar mi vida digital').setVersion('0.1').build()
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))
  }

  const port = Number(process.env['PORT'] ?? 3010)
  await app.listen(port)
  Logger.log(`API en http://localhost:${port}/api`, 'Bootstrap')
}

void bootstrap()
