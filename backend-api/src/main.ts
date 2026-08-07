import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureNestApp } from "./server";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);
  configureNestApp(app);
  await app.listen(Number(config.get<string>("PORT") ?? 4000));
}

void bootstrap();
