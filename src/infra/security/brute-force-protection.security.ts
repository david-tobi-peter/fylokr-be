import { DatabaseError, UnauthorizedError } from "#/core/errors";
import { Logger } from "#/infra/logger";
import { AuthCacheService } from "#/infra/cache";
import { RedisCoreServiceInstance } from "#/infra/database/redis";
import { Service } from "typedi";
import { userRepository } from "#/infra/database/postgres/repositories";

@Service()
export class BruteForceProtectionService {
  constructor(
    private readonly MAX_FAILURES = 6,
    private readonly BASE_COOLDOWN_SECONDS = 30,
    private readonly FAIL_WINDOW = 30 * Math.pow(2, 5) + 300, // Max cooldown + 5min buffer = 1260s (21 min)
    private authCacheService: AuthCacheService = new AuthCacheService(),
  ) {}

  /**
   * @async
   * @param {string} id
   * @returns {Promise<void>}
   * @throws {UnauthorizedError}
   */
  public async ensureAllowed(id: string): Promise<void> {
    const { isDisabled, inCooldown, cooldownExpiresIn } =
      await this.checkState(id);

    if (isDisabled) {
      Logger.warn(`Blocked attempt on disabled account: ${id}`);
      throw new UnauthorizedError("Account disabled. Contact support.");
    }

    if (inCooldown) {
      Logger.info(`Rate limited auth attempt: ${id}`);
      throw new UnauthorizedError(
        `Too many attempts. Please wait for ${cooldownExpiresIn ? cooldownExpiresIn : 30} seconds before retrying.`,
      );
    }
  }

  private calculateCooldown(failureCount: number): number {
    // Exponential backoff: 30s, 60s, 120s, 240s, 480s, 960s
    return (
      this.BASE_COOLDOWN_SECONDS * Math.pow(2, Math.min(failureCount - 1, 5))
    );
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  public async recordFailure(id: string): Promise<void> {
    const cooldownKey = this.cooldownKey(id);
    const failKey = this.failKey(id);
    const disabledKey = this.disabledKey(id);

    const tx = RedisCoreServiceInstance.multi();

    tx.incr(failKey);
    tx.expire(failKey, this.FAIL_WINDOW);

    const results = await tx.exec();

    if (!results) {
      throw new DatabaseError(
        "Transaction to record auth failure in redis failed",
      );
    }

    const incrResult = results[0];
    const failureCount = Number(incrResult?.[1] ?? 0);

    const cooldownSeconds = this.calculateCooldown(failureCount);
    await RedisCoreServiceInstance.set({
      key: cooldownKey,
      value: "1",
      ttlSeconds: cooldownSeconds,
    });

    if (failureCount >= this.MAX_FAILURES) {
      await RedisCoreServiceInstance.set({
        key: disabledKey,
        value: Date.now().toString(),
      });
      await this.disableAccount(id);

      Logger.warn(
        `Account ${id} disabled after ${this.MAX_FAILURES} failed attempts`,
      );
      throw new UnauthorizedError(
        "Account locked due to multiple failed auth attempts. Please contact support to restore access.",
      );
    }
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  public async clearFailures(id: string): Promise<void> {
    await RedisCoreServiceInstance.delete(this.failKey(id));
    await RedisCoreServiceInstance.delete(this.cooldownKey(id));
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  public async enableAccount(id: string): Promise<void> {
    await RedisCoreServiceInstance.delete(this.disabledKey(id));
    await RedisCoreServiceInstance.delete(this.failKey(id));
    await RedisCoreServiceInstance.delete(this.cooldownKey(id));

    await userRepository.updateRecord({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  public async disableAccount(id: string): Promise<void> {
    await userRepository.updateRecord({
      where: { id },
      data: { isActive: false },
    });

    await this.authCacheService.invalidateCachedAuthValue({
      identifier: id,
      category: "brute-force-protection",
    });
    await this.authCacheService.logoutAllSessions(id);

    await RedisCoreServiceInstance.delete(this.failKey(id));
    await RedisCoreServiceInstance.delete(this.cooldownKey(id));
  }

  /**
   * @param {string} id
   * @returns {Promise<{
   *   inCooldown: boolean;
   *   remainingAttempts: number;
   *   cooldownExpiresIn: number | null;
   *   isDisabled: boolean;
   * }>}
   */
  private async checkState(id: string): Promise<{
    inCooldown: boolean;
    remainingAttempts: number;
    cooldownExpiresIn: number | null;
    isDisabled: boolean;
  }> {
    const cooldownKey = this.cooldownKey(id);
    const failKey = this.failKey(id);
    const disabledKey = this.disabledKey(id);

    const [cooldownRaw, failuresRaw, isDisabled] = await Promise.all([
      RedisCoreServiceInstance.get(cooldownKey),
      RedisCoreServiceInstance.get(failKey),
      RedisCoreServiceInstance.get(disabledKey),
    ]);

    const failureCount = Number(failuresRaw ?? 0);
    const remainingAttempts = Math.max(0, this.MAX_FAILURES - failureCount);

    const ttl = await RedisCoreServiceInstance.getTTL(cooldownKey);
    const cooldownExpiresIn = ttl > 0 ? ttl : null;

    return {
      inCooldown: Boolean(cooldownRaw),
      remainingAttempts,
      cooldownExpiresIn,
      isDisabled: Boolean(isDisabled),
    };
  }

  private failKey(id: string): string {
    return `bfp:${id}:fails`;
  }

  private cooldownKey(id: string): string {
    return `bfp:${id}:cooldown`;
  }

  private disabledKey(id: string): string {
    return `bfp:${id}:disabled`;
  }
}
