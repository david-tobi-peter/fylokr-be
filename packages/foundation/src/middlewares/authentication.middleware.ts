import { Container } from "typedi";
import type { Request, Response, NextFunction } from "express";
import { AuthCacheService } from "#foundation/cache/index.js";
import {
  ERROR_STATUS_CODES,
  ERROR_TYPE_DEFAULTS,
} from "#foundation/shared/consts/index.js";
import {
  ERROR_TYPE_ENUM,
  TokenCategoryEnum,
} from "#foundation/shared/enums/index.js";
import {
  ClientHeuristicFingerprint,
  JwtSecurity,
} from "#foundation/security/index.js";
import type { ILoginPayload } from "#foundation/shared/interfaces/index.js";
import { JwtTokenError } from "#foundation/errors/index.js";
import { Logger } from "#foundation/logger/index.js";
import type {
  IErrorConfig,
  ILoggerConfig,
} from "#foundation/shared/interfaces/index.js";
import type { TokenPayloadType } from "#foundation/shared/types/common/index.js";

export function extractVerificationToken(
  expectedCategory: (typeof TokenCategoryEnum)[keyof typeof TokenCategoryEnum],
  loggerConfig: ILoggerConfig,
  errorConfig: IErrorConfig,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (response.headersSent) {
      return;
    }

    try {
      const verificationToken = request.headers["x-verification-token"] as
        | string
        | undefined;

      if (!verificationToken) {
        return response
          .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.UNAUTHORIZED])
          .json({
            error: {
              message: "Verification token required",
              type: ERROR_TYPE_ENUM.UNAUTHORIZED,
            },
          });
      }

      const decodedToken =
        Container.get(JwtSecurity).verifyAndDecodeToken<TokenPayloadType>(
          verificationToken,
        );

      if (decodedToken.tokenCategory !== expectedCategory) {
        return response
          .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.UNAUTHORIZED])
          .json({
            error: {
              message: "Invalid verification token type",
              type: ERROR_TYPE_ENUM.UNAUTHORIZED,
            },
          });
      }

      request.verificationToken = verificationToken;
      return next();
    } catch (error) {
      if (error instanceof JwtTokenError) {
        Logger.warn(error.toLogObject(loggerConfig.includeStackTrace));

        return response.status(error.statusCode).json({
          error: {
            message: error.exposeMessage(errorConfig.isVerbose),
            type: error.type,
          },
        });
      }

      return response
        .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR])
        .json({
          error: {
            message: "Failed to verify token",
            type: ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR,
          },
        });
    }
  };
}

export function authentication(
  loggerConfig: ILoggerConfig,
  errorConfig: IErrorConfig,
) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      if (response.headersSent) {
        return;
      }

      function extractAuthorizationToken(req: Request): string | undefined {
        const { authorization } = req.headers;

        if (!authorization) {
          return undefined;
        }

        return authorization.replace(/^Bearer\s+/i, "");
      }

      const token = extractAuthorizationToken(request);

      if (!token) {
        return response
          .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.UNAUTHORIZED])
          .json({
            error: {
              message: "Authorization Token Required",
              type: ERROR_TYPE_ENUM.UNAUTHORIZED,
            },
          });
      }

      const decodedToken =
        Container.get(JwtSecurity).verifyAndDecodeToken<ILoginPayload>(token);

      const { id, tokenCategory } = decodedToken;

      if (tokenCategory !== TokenCategoryEnum.LOGIN) {
        return response
          .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.UNAUTHORIZED])
          .json({
            error: {
              message: "Unauthorized - Invalid token",
              type: ERROR_TYPE_ENUM.UNAUTHORIZED,
            },
          });
      }

      const userAgent = request.headers["user-agent"];
      if (!userAgent) {
        return response
          .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.UNAUTHORIZED])
          .json({
            error: {
              message: "Unauthorized - User agent not found",
              type: ERROR_TYPE_ENUM.UNAUTHORIZED,
            },
          });
      }

      const fingerprintHash = Container.get(
        ClientHeuristicFingerprint,
      ).generateHash(userAgent);

      const isCachedUser = await Container.get(
        AuthCacheService,
      ).isLoginSessionValid({
        identifier: id,
        token,
        fingerprintHash,
      });

      if (!isCachedUser) {
        return response
          .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.UNAUTHORIZED])
          .json({
            error: {
              message: "Unauthorized - Session expired or invalidated",
              type: ERROR_TYPE_ENUM.UNAUTHORIZED,
            },
          });
      }

      request.user = { id };
      return next();
    } catch (error) {
      if (error instanceof JwtTokenError) {
        Logger.warn(error.toLogObject(loggerConfig.includeStackTrace));

        return response.status(error.statusCode).json({
          error: {
            message: error.exposeMessage(errorConfig.isVerbose),
            type: error.type,
          },
        });
      }

      return response
        .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR])
        .json({
          error: {
            message: ERROR_TYPE_DEFAULTS[ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR],
            type: ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR,
          },
        });
    }
  };
}
