import config from "#/config";
import { BadRequestError, JwtTokenError } from "#/core/errors";
import { TTLUnit } from "#/shared/enums";
import jwt from "jsonwebtoken";
import type { TokenPayloadType } from "#/shared/types/common";

class JwtSecurity {
  constructor(private secret = config.jwt.secret) {}

  /**
   * @param {TokenPayloadType} payload
   * @param {number} ttlSeconds
   * @returns {string}
   * @throws {JwtTokenError}
   */
  generateToken<T extends TokenPayloadType>(
    payload: T,
    ttlSeconds: number,
  ): string {
    try {
      return jwt.sign(
        {
          ...payload,
          iss: "fylokr",
          aud: "fylokr",
          jti: crypto.randomUUID(),
          exp: this.getExpirationTimestamp(ttlSeconds),
          iat: Math.floor(Date.now() / 1000),
        },
        this.secret,
        {
          header: {
            alg: "HS256",
            typ: "at+jwt",
          },
        },
      );
    } catch (error: unknown) {
      throw JwtTokenError.mapJwtError(error);
    }
  }

  /**
   * @param {string|undefined} token
   * @returns {T}
   * @throws {JwtTokenError|BadRequestError}
   */
  verifyAndDecodeToken<T extends TokenPayloadType>(
    token: string | undefined,
  ): T {
    try {
      if (!token) throw new JwtTokenError("No token supplied");

      const decoded = jwt.verify(token, this.secret, {
        algorithms: ["HS256"],
        issuer: "fylokr",
        audience: "fylokr",
        clockTolerance: 30,
      }) as T;
      return decoded;
    } catch (error: unknown) {
      throw JwtTokenError.mapJwtError(error);
    }
  }

  /**
   * @param {string|undefined} token
   * @returns {string}
   * @throws {JwtTokenError|BadRequestError}
   */
  static getTokenJTI(token: string | undefined): string {
    try {
      if (!token) throw new BadRequestError("No token supplied");

      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: ["HS256"],
      }) as { jti: string };

      return decoded.jti;
    } catch (error: unknown) {
      throw JwtTokenError.mapJwtError(error);
    }
  }

  protected getExpirationTimestamp(ttlSeconds: number): number {
    return Math.floor(Date.now() / 1000) + ttlSeconds;
  }

  generateTokenTTL(value: number, unit: TTLUnit): number {
    return value * unit;
  }
}

export const jwtSecurity = new JwtSecurity(config.jwt.secret);
