import "reflect-metadata";
import type { DataSourceOptions } from "typeorm";
import config from "#/config";
import { TypeORMCustomLogger } from "#/logger";

export const getOrmConfig = (): DataSourceOptions => ({
  ...config.db,
  entities: [],
  migrations: [],
  synchronize: false,
  migrationsRun: true,
  logging: true,
  logger: new TypeORMCustomLogger(),
  maxQueryExecutionTime: 500,
  migrationsTransactionMode: "all",
});
