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
   * @param {string|undefined} message
   */
  constructor(type: ERROR_TYPE_ENUM, message?: string) {
    super(message || ERROR_TYPE_DEFAULTS[type]);
    Object.setPrototypeOf(this, new.target.prototype);

    this.type = type;
    this.statusCode = ERROR_STATUS_CODES[type];
    this.name = this.constructor.name;

    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * @returns {boolean}
   */
  public shouldReport(): boolean {
    return false;
  }

  /**
   * @returns {string}
   */
  public exposeMessage(isVerbose: boolean): string {
    const isSensitive =
      this.type === ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR ||
      this.type === ERROR_TYPE_ENUM.DATABASE_ERROR;

    if (!isVerbose && isSensitive) {
      return ERROR_TYPE_DEFAULTS[this.type];
    }

    return this.message || ERROR_TYPE_DEFAULTS[this.type];
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
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.BAD_REQUEST, message);
  }
}

@Service()
export class UnauthorizedError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.UNAUTHORIZED, message);
  }
}

@Service()
export class ResourceNotFoundError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.NOT_FOUND, message);
  }
}

@Service()
export class ForbiddenError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.FORBIDDEN, message);
  }
}

@Service()
export class ServiceUnavailableError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.SERVICE_UNAVAILABLE, message);
  }
}

@Service()
export class RequestTimeoutError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.REQUEST_TIMEOUT, message);
  }
}

@Service()
export class ResourceConflictError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.RESOURCE_CONFLICT, message);
  }

  /**
   * @override
   * @returns {boolean}
   */
  override shouldReport(): boolean {
    return true;
  }
}

@Service()
export class ValidationError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.VALIDATION_ERROR, message);
  }
}

@Service()
export class FileNotFoundError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.NOT_FOUND, message);
  }
}

@Service()
export class DatabaseError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.DATABASE_ERROR, message);
  }

  /**
   * @override
   * @returns {boolean}
   */
  override shouldReport(): boolean {
    return true;
  }

  /**
   * @override
   * @param {boolean} isVerbose
   * @returns {string}
   */
  override exposeMessage(isVerbose: boolean): string {
    return isVerbose ? this.message : ERROR_TYPE_DEFAULTS[this.type];
  }
}

@Service()
export class InternalServerError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR, message);
  }

  /**
   * @override
   * @returns {boolean}
   */
  override shouldReport(): boolean {
    return true;
  }

  /**
   * @override
   * @param {boolean} isVerbose
   * @returns {string}
   */
  override exposeMessage(isVerbose: boolean): string {
    return isVerbose ? this.message : ERROR_TYPE_DEFAULTS[this.type];
  }
}

@Service()
export class JwtTokenError extends AppError {
  /**
   * @param {string|undefined} message
   */
  constructor(message?: string) {
    super(ERROR_TYPE_ENUM.UNAUTHORIZED, message);
  }

  /**
   * @override
   * @param {boolean} isVerbose
   * @returns {string}
   */
  override exposeMessage(isVerbose: boolean): string {
    return isVerbose ? this.message : "Invalid or expired token";
  }

  /**
   * @param {unknown} err
   * @returns {JwtTokenError}
   */
  static mapJwtError(err: unknown): JwtTokenError {
    if (err instanceof jwt.TokenExpiredError) {
      return new JwtTokenError("JWT has expired");
    }

    if (err instanceof jwt.NotBeforeError) {
      return new JwtTokenError("JWT not yet valid (nbf claim)");
    }

    if (err instanceof jwt.JsonWebTokenError) {
      const msg = err.message.toLowerCase();

      if (msg.includes("invalid token") || msg.includes("jwt malformed")) {
        return new JwtTokenError("JWT format is invalid");
      }

      if (msg.includes("signature is required")) {
        return new JwtTokenError("JWT signature is required");
      }

      if (msg.includes("invalid signature")) {
        return new JwtTokenError("JWT signature verification failed");
      }

      if (msg.includes("audience invalid")) {
        return new JwtTokenError("JWT audience claim is invalid");
      }

      if (msg.includes("issuer invalid")) {
        return new JwtTokenError("JWT issuer claim is invalid");
      }

      if (msg.includes("id invalid")) {
        return new JwtTokenError("JWT ID claim is invalid");
      }

      if (msg.includes("subject invalid")) {
        return new JwtTokenError("JWT subject claim is invalid");
      }

      return new JwtTokenError(`JWT validation failed: ${err.message}`);
    }

    const fallbackDetail = (() => {
      if (typeof err === "string") return err;

      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        return err.message;
      }

      return undefined;
    })();

    return new JwtTokenError(
      `${fallbackDetail ? `${fallbackDetail}` : "Unexpected JWT validation error"}`,
    );
  }
}
