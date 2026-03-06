import type { DataSourceOptions } from "typeorm";
import { TypeORMCustomLogger } from "#foundation/logger/index.js";
import type {
  IDatabaseConfig,
  ILoggerConfig,
} from "#foundation/shared/interfaces/index.js";

export const getOrmConfig = (
  db: IDatabaseConfig,
  loggerConfig: ILoggerConfig,
): DataSourceOptions => ({
  ...db,
  synchronize: false,
  migrationsRun: true,
  logging: true,
  logger: new TypeORMCustomLogger(loggerConfig),
  maxQueryExecutionTime: 500,
  migrationsTransactionMode: "all",
});
