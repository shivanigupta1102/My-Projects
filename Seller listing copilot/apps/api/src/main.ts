import { register } from 'tsconfig-paths';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

register({
  baseUrl: __dirname,
  paths: { '@/*': ['*'] },
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = corsOrigins.length === 0 || corsOrigins.some((pattern) => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
          return regex.test(origin);
        }
        return pattern === origin;
      });
      callback(null, allowed);
    },
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('ListingPilot API')
    .setDescription('ListingPilot AI backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number.parseInt(process.env.PORT ?? '4000', 10);
  await app.listen(port, '0.0.0.0');

  const has = (v: string) => process.env[v] ? '✓' : '✗';
  const aiSrc = process.env.GROQ_API_KEY ? 'GROQ env' : process.env.OPENROUTER_API_KEY ? 'OPENROUTER env' : 'built-in';
  console.log(`\n┌─── ListingPilot Startup ───────────────────────────`);
  console.log(`│ Server:    http://localhost:${port}`);
  console.log(`│ Swagger:   http://localhost:${port}/docs`);
  console.log(`│ Health:    http://localhost:${port}/api/v1/health`);
  console.log(`│`);
  console.log(`│ Database:  ${has('DATABASE_URL')} DATABASE_URL`);
  console.log(`│ Redis:     ${has('REDIS_HOST')} REDIS_HOST`);
  console.log(`│ Storage:   ${has('S3_ENDPOINT')} S3_ENDPOINT`);
  console.log(`│ AI Key:    ${aiSrc}`);
  console.log(`└────────────────────────────────────────────────────\n`);
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
