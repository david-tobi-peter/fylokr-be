import config from "#/config";
import { DatabaseError, ServiceUnavailableError } from "#/core/errors";
import { Logger } from "#/infra/logger";
import { Redis as IORedis, Redis as RedisClientType } from "ioredis";

export class RedisCoreService {
  private client: RedisClientType;
  private shutdownHookRegistered = false;

  constructor() {
    this.client = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      username: config.redis.username,
      password: config.redis.password,
      db: config.redis.database,
      retryStrategy: (times: number) => {
        if (times > 3) {
          throw new ServiceUnavailableError("Redis retry limit exceeded");
        }
        return times * 100;
      },
    });

    this.client.on("error", (err) => {
      Logger.error(
        `Redis client error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    });

    Logger.info("Redis database connected");
  }

  /**
   * @returns {Promise<void>}
   */
  public async shutdown(): Promise<void> {
    if (this.shutdownHookRegistered) return;
    this.shutdownHookRegistered = true;

    try {
      await this.client.quit();
      Logger.info("Redis connection closed");
    } catch (err) {
      Logger.error("Failed to close Redis connection:", err);
    }
  }

  /**
   * @param {string} key
   * @param {string} value
   * @param {number} [ttlSeconds]
   * @returns {Promise<string | null>}
   */
  public async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<string | null> {
    try {
      return ttlSeconds
        ? await this.client.set(key, value, "EX", ttlSeconds)
        : await this.client.set(key, value);
    } catch (err) {
      throw new DatabaseError(
        `Redis write failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * @param {string} key
   * @returns {Promise<string | null>}
   */
  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      throw new DatabaseError(
        `Redis read failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * @param {string} key
   * @returns {Promise<number>}
   */
  public async delete(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (err) {
      throw new DatabaseError(
        `Redis delete failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  public async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch (err) {
      throw new DatabaseError(
        `Redis exists check failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   * @returns {Promise<string[]>}
   */
  public async lrange(
    key: string,
    start: number,
    stop: number,
  ): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (err) {
      throw new DatabaseError(
        `Redis lrange failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * @param {string} key
   * @param {number} ttlSeconds
   * @returns {Promise<boolean>}
   */
  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      return (await this.client.expire(key, ttlSeconds)) === 1;
    } catch (err) {
      throw new DatabaseError(
        `Redis expire failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * @returns {ReturnType<RedisClientType["multi"]>}
   */
  public multi(): ReturnType<RedisClientType["multi"]> {
    return this.client.multi();
  }

  /**
   * @param {string} key
   * @returns {Promise<number | null>}
   */
  public async getTTL(key: string): Promise<number> {
    try {
      return this.client.ttl(key);
    } catch (err) {
      throw new DatabaseError(
        `Redis TTL fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }
}

export const RedisCoreServiceInstance = new RedisCoreService();
