import "reflect-metadata";
import { Container } from "typedi";
import express from "express";
import { App } from "./app.js";
import {
  closeDatabase,
  Logger,
  createDatabase,
  type IDatabaseConfig,
  type ILoggerConfig,
  type IFoundationConfig,
} from "@david-tobi-peter/foundation";
import config from "#backend/config/index.js";

async function bootstrap() {
  try {
    Container.set("IFoundationConfig", config);
    Container.set("IAppConfig", config.app);
    Container.set("IDatabaseConfig", config.db);
    Container.set("IRedisConfig", config.redis);
    Container.set("IJwtConfig", config.jwt);
    Container.set("ILoggerConfig", config.logger);
    Container.set("IErrorConfig", config.error);
    Container.set("IAuthenticatorConfig", config.authenticator);
    Container.set("ICloudflareConfig", config.cloudflare);

    createDatabase(
      config.db as IDatabaseConfig,
      config.logger as ILoggerConfig,
    );

    const expressApp = express();
    const app = new App(expressApp, config as IFoundationConfig);

    await app.initialize();
    app.run();

    const globalShutdown = async (signal: string) => {
      Logger.info(`Received ${signal}. Cleaning up...`);
      app.close();
      await closeDatabase();
      process.exit(0);
    };

    process.on("SIGINT", () => globalShutdown("SIGINT"));
    process.on("SIGTERM", () => globalShutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
