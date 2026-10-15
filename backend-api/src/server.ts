import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { RequestHandler } from "express";
import helmet from "helmet";
import {
  isAllowedOrigin,
  LOCAL_DEVELOPMENT_ORIGINS,
  normalizeOrigin,
  requestOriginGuard,
} from "./security/request-origin";

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

export function allowedCorsOrigins(config: ConfigService) {
  const configured = [
    config.get<string>("PORTFOLIO_URL"),
    config.get<string>("CMS_URL"),
    ...commaList(config.get<string>("CORS_ORIGINS")),
  ].filter((value): value is string => Boolean(value));
  if (configured.some((value) => value === "*")) {
    throw new Error("Wildcard CORS origins are not supported.");
  }
  if (configured.some((value) => normalizeOrigin(value) === null)) {
    throw new Error("CORS origins must be absolute HTTP or HTTPS origins.");
  }

  const configuredOrigins = [...new Set(configured.map((value) => normalizeOrigin(value) as string))];
  const isProduction = config.get<string>("NODE_ENV") === "production";
  const origins = isProduction
    ? configuredOrigins.filter((origin) => !LOCAL_DEVELOPMENT_ORIGINS.some((localOrigin) => localOrigin === origin))
    : [...new Set([...configuredOrigins, ...LOCAL_DEVELOPMENT_ORIGINS])];

  if (isProduction && origins.length === 0) {
    throw new Error("Production CORS requires an explicit origin allowlist.");
  }

  return origins;
}

export function configureNestApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const allowedOrigins = allowedCorsOrigins(config);

  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(requestOriginGuard(allowedOrigins));
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
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
