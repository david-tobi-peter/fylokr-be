import { config as dotenvConfig } from "dotenv";
import { join } from "path";
import { deepFreeze } from "@david-tobi-peter/foundation";
import type { IFoundationConfig } from "@david-tobi-peter/foundation";
import { UserEntity } from "#backend/entities/index.js";

// Load .env from root
dotenvConfig({ path: join(process.cwd(), "../../.env") });

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

const config: IFoundationConfig = {
  app: {
    environment: getEnv("NODE_ENV", "development"),
    isDev: process.env["NODE_ENV"] === "development",
    isProduction: process.env["NODE_ENV"] === "production",
    HOST_NAME: getRequiredEnv("HOST_NAME"),
    PORT: getNumericEnv("PORT", 3000),
    BASIC_USER: getEnv("BASIC_USER", "fylokr"),
    BASIC_PASS: getEnv("BASIC_PASS", "fylokr"),
  },
  db: {
    type: "postgres",
    host: getEnv("DB_HOST", "localhost"),
    port: getNumericEnv("DB_PORT", 5432),
    database: getEnv("DB_DATABASE", "fylokr"),
    username: getEnv("DB_USER", "fylokr"),
    password: getEnv("DB_PASSWORD", ""),
    entities: [UserEntity],
    migrations: [],
  },
  redis: {
    host: getRequiredEnv("REDIS_HOST"),
    port: getNumericEnv("REDIS_PORT", 6379),
    username: getRequiredEnv("REDIS_USERNAME"),
    password: getRequiredEnv("REDIS_PASSWORD"),
    database: getNumericEnv("REDIS_DB", 0),
  },
  jwt: {
    privateKey: getRequiredEnv("JWT_PRIVATE_KEY"),
    publicKey: getRequiredEnv("JWT_PUBLIC_KEY"),
  },
  logger: {
    includeStackTrace: getBooleanEnv("LOG_STACK_TRACE", false),
    logTypeOrmQuery: getBooleanEnv("LOG_TYPEORM_QUERIES", false),
  },
  error: {
    isVerbose: getBooleanEnv("IS_VERBOSE_ERROR", false),
  },
  authenticator: {
    secret: getRequiredEnv("AUTHENTICATOR_SECRET"),
  },
  cloudflare: {
    r2: {
      ACCESS_KEY_ID: getRequiredEnv("R2_ACCESS_KEY_ID"),
      SECRET_ACCESS_KEY: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
      BUCKET_IMAGES: getRequiredEnv("R2_BUCKET_IMAGES"),
      S3_API_ENDPOINT: getRequiredEnv("R2_S3_API_ENDPOINT"),
      PUBLIC_DOMAIN: getRequiredEnv("R2_PUBLIC_DOMAIN"),
    },
  },
};

export default deepFreeze(config);
export type { IFoundationConfig };
