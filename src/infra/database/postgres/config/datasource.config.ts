import { DataSource } from "typeorm";
import { getOrmConfig } from "./typeorm.config.js";
import { Logger } from "#/infra/logger";

export const AppDataSource = new DataSource(getOrmConfig());

export const initializeDatabase = async (): Promise<DataSource> => {
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
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    Logger.info("PostgreSQL connection closed");
  }
};
