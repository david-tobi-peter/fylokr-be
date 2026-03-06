import { Service, Inject } from "typedi";
import { BadRequestError, JwtTokenError } from "#foundation/errors/index.js";
import { TTLUnit } from "#foundation/shared/enums/index.js";
import type { IJwtConfig } from "#foundation/shared/interfaces/index.js";
import jwt from "jsonwebtoken";
import type { TokenPayloadType } from "#foundation/shared/types/common/index.js";

@Service()
export class JwtSecurity {
  private privateKey: string;
  private publicKey: string;

  constructor(@Inject("IJwtConfig") config: IJwtConfig) {
    this.privateKey = config.privateKey;
    this.publicKey = config.publicKey;
  }

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
        this.privateKey,
        {
          algorithm: "RS256",
          header: {
            alg: "RS256",
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

      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ["RS256"],
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
  getTokenJTI(token: string | undefined): string {
    try {
      if (!token) throw new BadRequestError("No token supplied");

      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ["RS256"],
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
