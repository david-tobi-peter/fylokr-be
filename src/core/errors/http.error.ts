import { BaseError } from "./base.error.js";
import { ERROR_TYPE_ENUM } from "#/shared/enums";

export class BadRequestError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.BAD_REQUEST;
  readonly statusCode = 400;
}

export class ResourceNotFoundError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.NOT_FOUND;
  readonly statusCode = 404;
}

export class ResourceConflictError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.RESOURCE_CONFLICT;
  readonly statusCode = 409;
}

export class ValidationError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.VALIDATION_ERROR;
  readonly statusCode = 422;
}

export class RequestTimeoutError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.REQUEST_TIMEOUT;
  readonly statusCode = 408;
}

export class ServiceUnavailableError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.SERVICE_UNAVAILABLE;
  readonly statusCode = 503;
}
