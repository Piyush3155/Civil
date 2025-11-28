import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as os from 'os';
import * as fs from 'fs';

dotenv.config();

async function bootstrap() {
  // Load HTTPS SSL certificates
  const httpsOptions = {
    key: fs.readFileSync('certificates/localhost-key.pem'),
    cert: fs.readFileSync('certificates/localhost.pem'),
  };

  // Create HTTPS NestJS server
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  const port = Number(process.env.PORT) || 3000;

  // Enable CORS for client requests
  app.enableCors({
    origin: true, // Allow all origins during development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  });

  // --- Swagger Setup ---
  const config = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('NestJS API Documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);

  // --- URL Logs ---
  const localUrl = `https://localhost:${port}`;
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = '0.0.0.0';

  for (const iface of Object.values(networkInterfaces)) {
    if (!iface) continue;
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) {
        ipAddress = info.address;
      }
    }
  }

  const ipUrl = `https://${ipAddress}:${port}`;
  const swaggerUrl = `${localUrl}/api`;

  console.log('\n🔐 HTTPS App is running at:');
  console.log(`   Local:   ${localUrl}`);
  console.log(`   Network: ${ipUrl}`);
  console.log(`   Swagger: ${swaggerUrl}\n`);
}

bootstrap();
