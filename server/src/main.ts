import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as os from 'os';
import * as fs from 'fs';

dotenv.config();

async function bootstrap() {
  const isRender = process.env.RENDER === "true";

  let httpsOptions;
  if (!isRender) {
    try {
      if (
        fs.existsSync('certificates/localhost-key.pem') &&
        fs.existsSync('certificates/localhost.pem')
      ) {
        httpsOptions = {
          key: fs.readFileSync('certificates/localhost-key.pem'),
          cert: fs.readFileSync('certificates/localhost.pem'),
        };
      }
    } catch (error) {
      console.log('SSL certificates not found, running without HTTPS');
    }
  }

  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : {});

  const port = Number(process.env.PORT) || 3000;

  app.enableCors({
    origin: ['https://localhost:7000', 'https://localhost:7001', 'http://localhost:7000'],
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('NestJS API Documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 🔥 REQUIRED FOR RENDER
  await app.listen(port, '0.0.0.0');

  console.log(`Server running on port ${port}`);
}

bootstrap();
