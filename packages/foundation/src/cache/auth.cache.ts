import { Service, Inject } from "typedi";
import { RedisCoreService } from "#foundation/database/redis/index.js";
import type { RedisCoreService as IRedisCoreService } from "#foundation/database/redis/index.js";
import { JwtSecurity } from "#foundation/security/index.js";
import type { JwtSecurity as IJwtSecurity } from "#foundation/security/index.js";
import { AuthCategoryEnum } from "#foundation/shared/enums/index.js";

@Service()
export class AuthCacheService {
  @Inject(() => RedisCoreService)
  private readonly redis!: IRedisCoreService;

  @Inject(() => JwtSecurity)
  private readonly jwt!: IJwtSecurity;

  constructor() {}
  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {string} options.token
   * @param {string} options.fingerprintHash
   * @param {number} options.ttlSeconds
   * @returns {Promise<void>}
   */
  public async cacheLoginSession(options: {
    identifier: string;
    token: string;
    fingerprintHash: string;
    ttlSeconds: number;
  }): Promise<void> {
    const tokenJTI = this.jwt.getTokenJTI(options.token);
    const key = `auth:session:${options.identifier}:${options.fingerprintHash}`;

    await this.redis.set({
      key,
      value: tokenJTI,
      ttlSeconds: options.ttlSeconds,
    });
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {string} options.token
   * @param {string} options.fingerprintHash
   * @returns {Promise<boolean>}
   */
  public async isLoginSessionValid(options: {
    identifier: string;
    token: string;
    fingerprintHash: string;
  }): Promise<boolean> {
    const tokenJTI = this.jwt.getTokenJTI(options.token);
    const key = `auth:session:${options.identifier}:${options.fingerprintHash}`;

    return (await this.redis.get(key)) === tokenJTI;
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {string} options.fingerprintHash
   * @returns {Promise<void>}
   */
  public async logoutSession(options: {
    identifier: string;
    fingerprintHash: string;
  }): Promise<void> {
    const key = `auth:session:${options.identifier}:${options.fingerprintHash}`;

    await this.redis.delete(key);
  }

  /**
   * @param {string} identifier
   * @returns {Promise<void>}
   */
  public async logoutAllSessions(identifier: string): Promise<void> {
    const pattern = `auth:session:${identifier}:*`;
    const keys = await this.redis.getKeys(pattern);

    if (keys.length > 0) {
      await this.redis.delete(keys);
    }
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {string} options.value
   * @param {AuthCategoryEnum} options.category
   * @param {number} options.ttlSeconds
   * @returns {Promise<void>}
   */
  public async cacheAuthValue(options: {
    identifier: string;
    value: string;
    category: AuthCategoryEnum;
    ttlSeconds: number;
  }): Promise<void> {
    const key = `auth:${options.category}:${options.identifier}`;
    await this.redis.set({
      key,
      value: options.value,
      ttlSeconds: options.ttlSeconds,
    });
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {string} options.value
   * @param {AuthCategoryEnum} options.category
   * @returns {Promise<boolean>}
   */
  public async isAuthValueCached(options: {
    identifier: string;
    value: string;
    category: AuthCategoryEnum;
  }): Promise<boolean> {
    const key = `auth:${options.category}:${options.identifier}`;
    return (await this.redis.get(key)) === options.value;
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {AuthCategoryEnum} options.category
   * @returns {Promise<string | null>}
   */
  public async getCachedAuthValue(options: {
    identifier: string;
    category: AuthCategoryEnum;
  }): Promise<string | null> {
    const key = `auth:${options.category}:${options.identifier}`;
    return await this.redis.get(key);
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {AuthCategoryEnum} options.category
   * @returns {Promise<void>}
   */
  public async invalidateCachedAuthValue(options: {
    identifier: string;
    category: AuthCategoryEnum;
  }): Promise<void> {
    const key = `auth:${options.category}:${options.identifier}`;
    await this.redis.delete(key);
  }
}
