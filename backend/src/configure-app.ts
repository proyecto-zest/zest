import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { buildCorsOriginMatcher } from './cors-origins';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: buildCorsOriginMatcher(
      configService.getOrThrow<string>('CORS_ORIGIN'),
    ),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
