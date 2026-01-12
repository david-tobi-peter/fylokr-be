import { ERROR_TYPE_DEFAULTS, ERROR_STATUS_CODES } from "#/shared/consts";
import { ERROR_TYPE_ENUM } from "#/shared/enums";
import { Service } from "typedi";
import jwt from "jsonwebtoken";

interface IApiErrorObject {
  type: ERROR_TYPE_ENUM;
  message: string;
}

interface ILogErrorObject extends IApiErrorObject {
  statusCode: number;
  name: string;
  stack?: string;
}

@Service()
export abstract class AppError extends Error {
  public readonly type: ERROR_TYPE_ENUM;
  public readonly statusCode: number;

  /**
   * @param {ERROR_TYPE_ENUM} type
   * @param {string|Error|undefined} cause
   */
  constructor(type: ERROR_TYPE_ENUM, cause?: string | Error) {
    const message =
      cause instanceof Error
        ? cause.message
        : cause || ERROR_TYPE_DEFAULTS[type] || "An unexpected error occurred";

    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.type = type;
    this.statusCode = ERROR_STATUS_CODES[type];
    this.name = this.constructor.name;

    if (cause instanceof Error && cause.stack) {
      this.stack = cause.stack;
    } else {
      Error.captureStackTrace?.(this, this.constructor);
    }
  }

  /**
   * @returns {boolean}
   */
  public shouldReport(): boolean {
    return false;
  }

  /**
   * @param {boolean} isVerbose
   * @returns {string}
   */
  public exposeMessage(isVerbose: boolean): string {
    const isSensitive =
      this.type === ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR ||
      this.type === ERROR_TYPE_ENUM.DATABASE_ERROR;

    if (!isVerbose && isSensitive) {
      return ERROR_TYPE_DEFAULTS[this.type] || "An unexpected error occurred";
    }

    return (
      this.message ||
      ERROR_TYPE_DEFAULTS[this.type] ||
      "An unexpected error occurred"
    );
  }

  /**
   * @param {boolean} isVerbose
   * @returns {IApiErrorObject}
   */
  public toApiObject(isVerbose: boolean): IApiErrorObject {
    return {
      type: this.type,
      message: this.exposeMessage(isVerbose),
    };
  }

  /**
   * @param {boolean} [includeStack=false]
   * @returns {ILogErrorObject}
   */
  public toLogObject(includeStack: boolean = false): ILogErrorObject {
    const logObj: ILogErrorObject = {
      type: this.type,
      message: this.exposeMessage(true),
      statusCode: this.statusCode,
      name: this.name,
    };

    if (includeStack && this.stack) {
      logObj.stack = this.stack;
    }

    return logObj;
  }
}

@Service()
export class BadRequestError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.BAD_REQUEST, cause);
  }
}

@Service()
export class UnauthorizedError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.UNAUTHORIZED, cause);
  }
}

@Service()
export class ResourceNotFoundError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.NOT_FOUND, cause);
  }
}

@Service()
export class ForbiddenError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.FORBIDDEN, cause);
  }
}

@Service()
export class ServiceUnavailableError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.SERVICE_UNAVAILABLE, cause);
  }
}

@Service()
export class RequestTimeoutError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.REQUEST_TIMEOUT, cause);
  }
}

@Service()
export class ResourceConflictError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.RESOURCE_CONFLICT, cause);
  }

  override shouldReport(): boolean {
    return true;
  }
}

@Service()
export class ValidationError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.VALIDATION_ERROR, cause);
  }
}

@Service()
export class FileNotFoundError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.NOT_FOUND, cause);
  }
}

@Service()
export class DatabaseError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.DATABASE_ERROR, cause);
  }

  override shouldReport(): boolean {
    return true;
  }

  override exposeMessage(isVerbose: boolean): string {
    return isVerbose
      ? this.message
      : ERROR_TYPE_DEFAULTS[this.type] || "Database error occurred";
  }
}

@Service()
export class InternalServerError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR, cause);
  }

  override shouldReport(): boolean {
    return true;
  }

  override exposeMessage(isVerbose: boolean): string {
    return isVerbose
      ? this.message
      : ERROR_TYPE_DEFAULTS[this.type] || "Internal server error occurred";
  }
}

@Service()
export class JwtTokenError extends AppError {
  constructor(cause?: string | Error) {
    super(ERROR_TYPE_ENUM.UNAUTHORIZED, cause);
  }

  override exposeMessage(isVerbose: boolean): string {
    return isVerbose ? this.message : "Invalid or expired token";
  }

  static mapJwtError(err: unknown): JwtTokenError {
    if (err instanceof jwt.TokenExpiredError) {
      return new JwtTokenError(err);
    }

    if (err instanceof jwt.NotBeforeError) {
      return new JwtTokenError(err);
    }

    if (err instanceof jwt.JsonWebTokenError) {
      const msg = err.message.toLowerCase();

      if (msg.includes("invalid token") || msg.includes("jwt malformed")) {
        const specificError = new Error("JWT format is invalid");
        if (err.stack) specificError.stack = err.stack;
        return new JwtTokenError(specificError);
      }

      if (msg.includes("signature is required")) {
        const specificError = new Error("JWT signature is required");
        if (err.stack) specificError.stack = err.stack;
        return new JwtTokenError(specificError);
      }

      if (msg.includes("invalid signature")) {
        const specificError = new Error("JWT signature verification failed");
        if (err.stack) specificError.stack = err.stack;
        return new JwtTokenError(specificError);
      }

      if (msg.includes("audience invalid")) {
        const specificError = new Error("JWT audience claim is invalid");
        if (err.stack) specificError.stack = err.stack;
        return new JwtTokenError(specificError);
      }

      if (msg.includes("issuer invalid")) {
        const specificError = new Error("JWT issuer claim is invalid");
        if (err.stack) specificError.stack = err.stack;
        return new JwtTokenError(specificError);
      }

      if (msg.includes("id invalid")) {
        const specificError = new Error("JWT ID claim is invalid");
        if (err.stack) specificError.stack = err.stack;
        return new JwtTokenError(specificError);
      }

      if (msg.includes("subject invalid")) {
        const specificError = new Error("JWT subject claim is invalid");
        if (err.stack) specificError.stack = err.stack;
        return new JwtTokenError(specificError);
      }

      return new JwtTokenError(err);
    }

    if (typeof err === "string") {
      return new JwtTokenError(err);
    }

    if (
      err &&
      typeof err === "object" &&
      "message" in err &&
      typeof err.message === "string"
    ) {
      return new JwtTokenError(err.message);
    }

    return new JwtTokenError("Unexpected JWT validation error");
  }
}
