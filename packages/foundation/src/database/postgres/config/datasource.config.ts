import { DataSource } from "typeorm";
import { Logger } from "#foundation/logger/index.js";
import { getOrmConfig } from "./typeorm.config.js";
import type {
  IDatabaseConfig,
  ILoggerConfig,
} from "#foundation/shared/interfaces/index.js";

let AppDataSource: DataSource;

export const createDatabase = (
  db: IDatabaseConfig,
  loggerConfig: ILoggerConfig,
): DataSource => {
  AppDataSource = new DataSource(getOrmConfig(db, loggerConfig));
  return AppDataSource;
};

export const getAppDataSource = (): DataSource => {
  if (!AppDataSource) {
    throw new Error("Database not created. Call createDatabase() first.");
  }
  return AppDataSource;
};

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!AppDataSource) {
    throw new Error("Database not created. Call createDatabase() first.");
  }

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      Logger.info("PostgreSQL connected successfully");
    }
    return AppDataSource;
  } catch (error) {
    Logger.error("PostgreSQL connection failed:", error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource?.isInitialized) {
    await AppDataSource.destroy();
    Logger.info("PostgreSQL connection closed");
  }
};
