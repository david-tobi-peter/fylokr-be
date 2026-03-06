import type { IDatabaseConfig, IRedisConfig } from "./database.interface.js";

export interface IAppConfig {
  readonly environment: string;
  readonly isDev: boolean;
  readonly isProduction: boolean;
  readonly HOST_NAME: string;
  readonly PORT: number;
  readonly BASIC_USER?: string;
  readonly BASIC_PASS?: string;
}

export interface IJwtConfig {
  readonly privateKey: string;
  readonly publicKey: string;
}

export interface ILoggerConfig {
  readonly includeStackTrace: boolean;
  readonly logTypeOrmQuery: boolean;
}

export interface IErrorConfig {
  readonly isVerbose: boolean;
}

export interface IAuthenticatorConfig {
  readonly secret: string;
}

export interface ICloudflareConfig {
  readonly r2: {
    readonly ACCESS_KEY_ID: string;
    readonly SECRET_ACCESS_KEY: string;
    readonly BUCKET_IMAGES: string;
    readonly S3_API_ENDPOINT: string;
    readonly PUBLIC_DOMAIN: string;
  };
}

export interface IFoundationConfig {
  readonly app: IAppConfig;
  readonly db: IDatabaseConfig;
  readonly redis: IRedisConfig;
  readonly jwt: IJwtConfig;
  readonly logger: ILoggerConfig;
  readonly error: IErrorConfig;
  readonly authenticator: IAuthenticatorConfig;
  readonly cloudflare: ICloudflareConfig;
}
