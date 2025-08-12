import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Health check endpoint
  app.getHttpAdapter().get('/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'mobula-seo-agent'
    });
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  
  logger.log(`🚀 Mobula SEO Agent is running on port ${port}`);
  logger.log('🤖 Autonomous SEO execution is ACTIVE');
}
bootstrap();
