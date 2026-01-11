import "reflect-metadata";
import type { Express } from "express";
import { closeDatabase, initializeDatabase } from "#/postgres/config";
import { RouteManager } from "#/routes";
import config from "#/config";
import http from "http";
import { Logger } from "#/logger";
import express from "express";

const app: Express = express();
const server: http.Server = http.createServer(app);

async function bootstrap() {
  try {
    await initializeDatabase();
    Logger.info("Postgres database connected");
  } catch (err) {
    Logger.error(`Could not initialize database: ${err}`);
    process.exit(1);
  }

  RouteManager.registerRoutes(app);

  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  server.timeout = 10000;

  server.listen(config.app.PORT, () => {
    Logger.info(`Server running on ${config.app.HOST_NAME}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      Logger.error(`Port ${config.app.PORT} is already in use.`);
    } else {
      Logger.error("Server error:", err);
    }
    process.exit(1);
  });
}

async function globalShutdown(signal: string) {
  Logger.info(`Received ${signal}. Cleaning up...`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            Logger.error("Error closing HTTP server:", err);
            reject(err);
          } else {
            Logger.info("HTTP server closed");
            resolve();
          }
        });
      });
    }

    await closeDatabase();
    process.exit(0);
  } catch (err) {
    Logger.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => globalShutdown("SIGINT"));
process.on("SIGTERM", () => globalShutdown("SIGTERM"));

bootstrap();
