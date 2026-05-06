import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS enable
  app.enableCors();
  
  // JSON body size limit
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  await app.listen(3000);
  console.log('🚀 Server çalışıyor: http://localhost:3000');
}

bootstrap();
