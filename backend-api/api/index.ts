import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import * as express from "express";
import { AppModule } from "../src/app.module";
import { configureNestApp } from "../src/server";

let cachedServer: express.Express | undefined;

async function createServer() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { cors: false });

  configureNestApp(app);
  await app.init();

  return expressApp;
}

export default async function handler(request: express.Request, response: express.Response) {
  cachedServer ??= await createServer();
  return cachedServer(request, response);
}
