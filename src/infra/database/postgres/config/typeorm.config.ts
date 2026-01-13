import type { DataSourceOptions } from "typeorm";
import config from "#/config";
import { TypeORMCustomLogger } from "#/logger";
import * as entities from "#/postgres/entities";

export const getOrmConfig = (): DataSourceOptions => ({
  ...config.db,
  entities: Object.values(entities),
  migrations: ["src/infra/database/migrations/*.ts"],
  synchronize: false,
  migrationsRun: true,
  logging: true,
  logger: new TypeORMCustomLogger(),
  maxQueryExecutionTime: 500,
  migrationsTransactionMode: "all",
});
