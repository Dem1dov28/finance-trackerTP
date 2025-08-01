import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.enableCors({
    origin: configService.get('ALLOWED_ORIGINS').split(','),
    credentials: true,
    exposedHeaders: ['Authorization'],
  });
  const port = parseInt(configService.get('PORT', '3000'), 10);
  await app.listen(port);
}
bootstrap();
