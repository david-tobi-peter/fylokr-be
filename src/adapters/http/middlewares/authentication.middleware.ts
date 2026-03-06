import type { NextFunction, Response, Request } from "express";
import { authCacheService } from "#/infra/cache";
import { ERROR_STATUS_CODES, ERROR_TYPE_DEFAULTS } from "#/shared/consts";
import { ERROR_TYPE_ENUM, TokenCategoryEnum } from "#/shared/enums";
import { clientHeuristicFingerprint, jwtSecurity } from "#/infra/security";
import type { ILoginPayload } from "#/shared/interfaces";
import { JwtTokenError } from "#/core/errors";
import { Logger } from "#/infra/logger";
import config from "#/config";
import type { TokenPayloadType } from "#/shared/types/common";

export function extractVerificationToken(
  expectedCategory: (typeof TokenCategoryEnum)[keyof typeof TokenCategoryEnum],
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
        jwtSecurity.verifyAndDecodeToken<TokenPayloadType>(verificationToken);

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
        Logger.warn(error.toLogObject(config.logger.includeStackTrace));

        return response.status(error.statusCode).json({
          error: {
            message: error.exposeMessage(config.error.isVerbose),
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

export async function authentication(
  request: Request,
  response: Response,
  next: NextFunction,
) {
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

    const decodedToken = jwtSecurity.verifyAndDecodeToken<ILoginPayload>(token);

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

    const fingerprintHash = clientHeuristicFingerprint.generateHash(userAgent);

    const isCachedUser = await authCacheService.isLoginSessionValid({
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
      Logger.warn(error.toLogObject(config.logger.includeStackTrace));

      return response.status(error.statusCode).json({
        error: {
          message: error.exposeMessage(config.error.isVerbose),
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
}
