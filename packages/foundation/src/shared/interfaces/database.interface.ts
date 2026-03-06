import type { DataSourceOptions } from "typeorm";

export interface IDatabaseConfig {
  readonly type: "postgres";
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly entities: NonNullable<DataSourceOptions["entities"]>;
  readonly migrations: NonNullable<DataSourceOptions["migrations"]>;
}

export interface IRedisConfig {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: number;
}
