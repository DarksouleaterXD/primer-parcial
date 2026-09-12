import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module.js";
import {
  readApiConfiguration,
  type ApiConfiguration,
} from "./config/api-configuration.js";

export async function createApiApplication(
  configuration: ApiConfiguration = readApiConfiguration(),
): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(configuration),
    { logger: false },
  );

  app.enableCors({
    origin(origin, callback) {
      callback(null, !origin || origin === configuration.webOrigin);
    },
  });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Primer Parcial API")
      .setVersion("0.0.0")
      .build(),
  );

  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs-json",
  });

  await app.init();
  return app;
}

export async function bootstrap(): Promise<void> {
  const configuration = readApiConfiguration();
  const app = await createApiApplication(configuration);

  await app.listen(configuration.port);
}
