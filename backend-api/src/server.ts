import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { RequestHandler } from "express";
import helmet from "helmet";

type CompressionFactory = (
  options?: import("compression").CompressionOptions,
) => RequestHandler;
type CookieParserFactory = (
  secret?: string | string[],
  options?: import("cookie-parser").CookieParseOptions,
) => RequestHandler;

const compression = require("compression") as CompressionFactory;
const cookieParser = require("cookie-parser") as CookieParserFactory;

function commaList(value?: string) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

export function configureNestApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const allowedOrigins = [
    config.get<string>("PORTFOLIO_URL"),
    config.get<string>("CMS_URL"),
    ...commaList(config.get<string>("CORS_ORIGINS")),
    "http://localhost:3100",
    "http://127.0.0.1:3100",
    "http://localhost:3001",
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
}
