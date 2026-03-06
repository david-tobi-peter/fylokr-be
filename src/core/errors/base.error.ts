import type { ERROR_TYPE_ENUM } from "#/shared/enums";
import { ERROR_TYPE_DEFAULTS } from "#/shared/consts";

interface IApiErrorObject {
  type: ERROR_TYPE_ENUM;
  message: string;
}

interface ILogErrorObject {
  message: string;
  statusCode: number;
  name: string;
  stack?: string;
}

export abstract class BaseError extends Error {
  abstract readonly type: ERROR_TYPE_ENUM;
  abstract readonly statusCode: number;
  protected readonly isSensitive: boolean = false;

  constructor(cause?: string | Error) {
    const message =
      cause instanceof Error
        ? cause.message
        : (cause ?? "An unexpected error occurred");

    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;

    if (cause instanceof Error && cause.stack) {
      this.stack = cause.stack;
    } else {
      Error.captureStackTrace?.(this, this.constructor);
    }
  }

  public exposeMessage(isVerbose: boolean): string {
    if (!isVerbose && this.isSensitive) {
      return ERROR_TYPE_DEFAULTS[this.type];
    }

    return this.message ?? ERROR_TYPE_DEFAULTS[this.type];
  }

  public toApiObject(isVerbose: boolean): IApiErrorObject {
    return { type: this.type, message: this.exposeMessage(isVerbose) };
  }

  public toLogObject(includeStack = false): ILogErrorObject {
    return {
      message: this.exposeMessage(true),
      statusCode: this.statusCode,
      name: this.name,
      ...(includeStack && this.stack ? { stack: this.stack } : {}),
    };
  }
}
