import { ERROR_TYPE_ENUM } from "#foundation/shared/enums/index.js";
import { BaseError } from "./base.error.js";

export class DatabaseError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.DATABASE_ERROR;
  readonly statusCode = 500;
  protected override readonly isSensitive = true;
}

export class InternalServerError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR;
  readonly statusCode = 500;
  protected override readonly isSensitive = true;
}

export class ConfigurationError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.CONFIGURATION_ERROR;
  readonly statusCode = 500;
}
