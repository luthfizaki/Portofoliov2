import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);
  const allowedOrigins = [
    config.get<string>("PORTFOLIO_URL"),
    config.get<string>("CMS_URL"),
    "http://localhost:3100",
    "http://127.0.0.1:3100",
    "http://127.0.0.1:3001",
  ].filter((value): value is string => Boolean(value));

  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (config.get<string>("NODE_ENV") !== "production") {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Portfolio V2 API")
        .setVersion("v1")
        .build(),
    );
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(Number(config.get<string>("PORT") ?? 4000));
}

void bootstrap();
