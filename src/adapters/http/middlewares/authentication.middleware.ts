import { IsNull } from "typeorm";

import type { NextFunction, Response, Request } from "express";
import { AuthCacheService } from "#/infra/cache";
import { ERROR_STATUS_CODES, ERROR_TYPE_DEFAULTS } from "#/shared/consts";
import { ERROR_TYPE_ENUM, TokenCategoryEnum, TTLUnit } from "#/shared/enums";
import { fingerprintSecurity, jwtSecurity } from "#/infra/security";
import type { ILoginPayload } from "#/shared/interfaces";
import { userRepository } from "#/infra/database/postgres/repositories";
import { JwtTokenError } from "#/core/errors";
import { Logger } from "#/infra/logger";
import config from "#/config";

export async function userAuthentication(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (response.headersSent) {
      return;
    }

    const authCacheService = new AuthCacheService();

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

    const userAgent = request.headers["user-agent"] || "unknown";
    const fingerprintHash = fingerprintSecurity.generateHash(userAgent);

    const isCachedUser = await authCacheService.isLoginSessionValid({
      identifier: id,
      token,
      fingerprintHash,
    });
    if (isCachedUser) {
      request.user = { id };
      return next();
    }

    const user = await userRepository.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      return response
        .status(ERROR_STATUS_CODES[ERROR_TYPE_ENUM.UNAUTHORIZED])
        .json({
          error: {
            message: "Unauthorized - Request for access code",
            type: ERROR_TYPE_ENUM.UNAUTHORIZED,
          },
        });
    }

    const newToken = jwtSecurity.generateToken(
      { id, tokenCategory: TokenCategoryEnum.LOGIN },
      jwtSecurity.generateTokenTTL(7, TTLUnit.DAYS),
    );
    const newTokenTTL = jwtSecurity.generateTokenTTL(7, TTLUnit.DAYS);

    await authCacheService.cacheLoginSession({
      identifier: id,
      token: newToken,
      fingerprintHash,
      ttlSeconds: newTokenTTL,
    });

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
