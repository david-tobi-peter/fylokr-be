import { config } from "dotenv";

config({ path: ".env" });

type DeepReadonly<T> = T extends (...args: unknown[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export function deepFreeze<T extends object>(obj: T): DeepReadonly<T> {
  if (Object.isFrozen(obj)) return obj as DeepReadonly<T>;

  Object.freeze(obj);

  const keys = [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ] as Array<keyof T>;

  for (const key of keys) {
    const value = obj[key];

    if (
      value &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value as object);
    }
  }

  return obj as DeepReadonly<T>;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getNumericEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getBooleanEnv(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;

  return value === "true" || value === "1";
}

const app = {
  environment: getEnv("NODE_ENV", "development"),
  isDev: process.env["NODE_ENV"] === "development",
  isProduction: process.env["NODE_ENV"] === "production",
  HOST_NAME: getRequiredEnv("HOST_NAME"),
  PORT: getNumericEnv("PORT", 3000),
  BASIC_USER: getEnv("BASIC_USER", "fylokr"),
  BASIC_PASS: getEnv("BASIC_PASS", "fylokr"),
} as const;

const db = {
  type: "postgres" as const,
  host: getEnv("DB_HOST", "localhost"),
  port: getNumericEnv("DB_PORT", 5432),
  database: getEnv("DB_DATABASE", "fylokr"),
  username: getEnv("DB_USER", "fylokr"),
  password: getEnv("DB_PASSWORD", ""),
} as const;

const cloudflare = {
  r2: {
    ACCESS_KEY_ID: getRequiredEnv("R2_ACCESS_KEY_ID"),
    SECRET_ACCESS_KEY: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    BUCKET_IMAGES: getRequiredEnv("R2_BUCKET_IMAGES"),
    S3_API_ENDPOINT: getRequiredEnv("R2_S3_API_ENDPOINT"),
    PUBLIC_DOMAIN: getRequiredEnv("R2_PUBLIC_DOMAIN"),
  },
} as const;

const redis = {
  host: getRequiredEnv("REDIS_HOST"),
  port: getNumericEnv("REDIS_PORT", 6379),
  username: getRequiredEnv("REDIS_USERNAME"),
  password: getRequiredEnv("REDIS_PASSWORD"),
  database: getNumericEnv("REDIS_DB", 0),
} as const;

const jwt = {
  secret: getRequiredEnv("JWT_SECRET"),
} as const;

const logger = {
  includeStackTrace: getBooleanEnv("LOG_STACK_TRACE", false),
  logTypeOrmQuery: getBooleanEnv("LOG_TYPEORM_QUERIES", false),
} as const;

const error = {
  isVerbose: getBooleanEnv("IS_VERBOSE_ERROR", false),
} as const;

const authenticator = {
  secret: getRequiredEnv("AUTHENTICATOR_SECRET"),
} as const;

export default deepFreeze({
  app,
  db,
  redis,
  jwt,
  logger,
  error,
  authenticator,
  cloudflare,
});
