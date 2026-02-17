import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { LoggingMiddleware } from "./logging.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.use(new LoggingMiddleware().use);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🐝 Buzzline API running on http://localhost:${port}`);
}
bootstrap();
