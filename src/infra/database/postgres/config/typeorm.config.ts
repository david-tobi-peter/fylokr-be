import type { DataSourceOptions } from "typeorm";
import config from "#/config";
import { TypeORMCustomLogger } from "#/infra/logger";
import * as entities from "#/infra/database/postgres/entities";
import * as migrations from "#/infra/database/postgres/migrations";

export const getOrmConfig = (): DataSourceOptions => ({
  ...config.db,
  entities: Object.values(entities),
  migrations: Object.values(migrations),
  synchronize: false,
  migrationsRun: true,
  logging: true,
  logger: new TypeORMCustomLogger(),
  maxQueryExecutionTime: 500,
  migrationsTransactionMode: "all",
});
