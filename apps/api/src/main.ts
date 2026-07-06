import './instrument';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/http/response.interceptor';
import { HttpExceptionFilter } from './common/http/http-exception.filter';

/** Falls back to the local web dev origin when unset — see CORS_ALLOWED_ORIGINS in .env.example. */
const DEFAULT_DEV_ORIGIN = 'http://localhost:3000';

function resolveAllowedOrigins(): string[] {
  const configured = process.env.CORS_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    Logger.warn(
      'CORS_ALLOWED_ORIGINS is not set in production — falling back to the local dev origin only. ' +
        'Set it to your real web domain(s) before serving real traffic.',
      'Bootstrap',
    );
  }

  return [DEFAULT_DEV_ORIGIN];
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: resolveAllowedOrigins() });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Orion Flight Lab API')
    .setDescription(
      'Sistema de gestão de CTAC certificado ANAC (RBAC 142 / IS 142-001). ' +
        'Todas as respostas seguem o formato { data, meta, errors }.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'supabase-jwt')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}

void bootstrap();
