import { Service } from "typedi";
import bcrypt from "bcrypt";
import { userRepository } from "#/infra/database/postgres/repositories";
import type { SignUpRequestType, SignUpResponseType } from "#/shared/types/api";
import { InternalServerError, ResourceConflictError } from "#/core/errors";
import { clientHeuristicFingerprint, jwtSecurity } from "#/infra/security";
import { TokenCategoryEnum, TTLUnit } from "#/shared/enums";
import { authCacheService } from "#/infra/cache";

@Service()
export class AuthService {
  async signUp(
    data: SignUpRequestType,
    userAgent: string,
  ): Promise<SignUpResponseType> {
    const userExists = await userRepository.findOne({
      where: { username: data.username },
      withDeleted: true,
    });

    if (userExists) {
      throw new ResourceConflictError("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await userRepository.createRecord({
      data: {
        username: data.username,
        hashedPassword,
      },
    });

    const tokenTTL = jwtSecurity.generateTokenTTL(7, TTLUnit.DAYS);
    const token = jwtSecurity.generateToken(
      { id: newUser.id, tokenCategory: TokenCategoryEnum.LOGIN },
      tokenTTL,
    );

    const fingerprintHash = clientHeuristicFingerprint.generateHash(userAgent);

    await authCacheService.cacheLoginSession({
      identifier: newUser.id,
      token,
      fingerprintHash,
      ttlSeconds: tokenTTL,
    });

    if (newUser) {
      return {
        data: {
          token,
        },
      };
    }

    throw new InternalServerError(
      "Could not complete sign up. Please try again",
    );
  }
}
