import { RedisCoreServiceInstance } from "#/infra/database/redis";
import { jwtSecurity } from "#/infra/security";
import { Service } from "typedi";

type AuthValueCategory = "brute-force-protection" | "verification";

@Service()
class AuthCacheService {
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
    const tokenJTI = jwtSecurity.getTokenJTI(options.token);
    const key = `auth:session:${options.identifier}:${options.fingerprintHash}`;

    await RedisCoreServiceInstance.set({
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
    const tokenJTI = jwtSecurity.getTokenJTI(options.token);
    const key = `auth:session:${options.identifier}:${options.fingerprintHash}`;

    return (await RedisCoreServiceInstance.get(key)) === tokenJTI;
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

    await RedisCoreServiceInstance.delete(key);
  }

  /**
   * @param {string} identifier
   * @returns {Promise<void>}
   */
  public async logoutAllSessions(identifier: string): Promise<void> {
    const pattern = `auth:session:${identifier}:*`;
    const keys = await RedisCoreServiceInstance.getKeys(pattern);

    if (keys.length > 0) {
      await RedisCoreServiceInstance.delete(keys);
    }
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {string} options.value
   * @param {AuthValueCategory} options.category
   * @param {number} options.ttlSeconds
   * @returns {Promise<void>}
   */
  public async cacheAuthValue(options: {
    identifier: string;
    value: string;
    category: AuthValueCategory;
    ttlSeconds: number;
  }): Promise<void> {
    const key = `auth:${options.category}:${options.identifier}`;
    await RedisCoreServiceInstance.set({
      key,
      value: options.value,
      ttlSeconds: options.ttlSeconds,
    });
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {string} options.value
   * @param {AuthValueCategory} options.category
   * @returns {Promise<boolean>}
   */
  public async isAuthValueCached(options: {
    identifier: string;
    value: string;
    category: AuthValueCategory;
  }): Promise<boolean> {
    const key = `auth:${options.category}:${options.identifier}`;
    return (await RedisCoreServiceInstance.get(key)) === options.value;
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {AuthValueCategory} options.category
   * @returns {Promise<string | null>}
   */
  public async getCachedAuthValue(options: {
    identifier: string;
    category: AuthValueCategory;
  }): Promise<string | null> {
    const key = `auth:${options.category}:${options.identifier}`;
    return await RedisCoreServiceInstance.get(key);
  }

  /**
   * @param {object} options
   * @param {string} options.identifier
   * @param {AuthValueCategory} options.category
   * @returns {Promise<void>}
   */
  public async invalidateCachedAuthValue(options: {
    identifier: string;
    category: AuthValueCategory;
  }): Promise<void> {
    const key = `auth:${options.category}:${options.identifier}`;
    await RedisCoreServiceInstance.delete(key);
  }
}

export const authCacheService = new AuthCacheService();
