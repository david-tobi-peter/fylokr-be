import jwt from "jsonwebtoken";
import { ERROR_TYPE_ENUM } from "#/shared/enums";
import { BaseError } from "./base.error.js";

export class UnauthorizedError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.UNAUTHORIZED;
  readonly statusCode = 401;
}

export class ForbiddenError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.FORBIDDEN;
  readonly statusCode = 403;
}

export class JwtTokenError extends BaseError {
  readonly type = ERROR_TYPE_ENUM.UNAUTHORIZED;
  readonly statusCode = 401;

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
