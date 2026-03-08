import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const uploadLimitBytes = 200 * 1024 * 1024;
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: uploadLimitBytes }),
  );

  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: uploadLimitBytes,
    },
  });

  app.enableCors();

  await app.listen(3001, '0.0.0.0');
}
void bootstrap();
