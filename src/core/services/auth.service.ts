import { Service } from "typedi";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { userRepository } from "#/infra/database/postgres/repositories";
import type {
  SignUpRequestType,
  SignUpResponseType,
  SignInRequestType,
  SignInResponseType,
  VerifyTwoFactorAuthenticationSignInResponseType,
  SetupTwoFactorAuthenticationResponseType,
  TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesRequestType,
  TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesResponseType,
  SaveRecoveryCodesResponseType,
  DisableTwoFactorAuthenticationRequestType,
  DisableTwoFactorAuthenticationResponseType,
  LogoutResponseType,
} from "#/shared/types/api";
import {
  BadRequestError,
  InternalServerError,
  ResourceConflictError,
  UnauthorizedError,
} from "#/core/errors";
import {
  BruteForceProtectionSecurity,
  clientHeuristicFingerprint,
  jwtSecurity,
  TwoFactorAuthenticationSecurity,
} from "#/infra/security";
import { AuthCategoryEnum, TokenCategoryEnum, TTLUnit } from "#/shared/enums";
import { authCacheService } from "#/infra/cache";
import { ILike, IsNull } from "typeorm";
import type {
  ILoginPayload,
  ITwoFaVerificationPayload,
} from "#/shared/interfaces";

@Service()
export class AuthService {
  /**
   * @param {SignUpRequestType} data
   * @param {string} userAgent
   * @returns {Promise<SignUpResponseType>}
   */
  async signUp(
    data: SignUpRequestType,
    userAgent: string,
  ): Promise<SignUpResponseType> {
    const userExists = await userRepository.findOne({
      where: { username: ILike(data.username) },
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

  /**
   * @param {SignInRequestType} signInData
   * @param {string} userAgent
   * @returns {Promise<SignInResponseType>}
   */
  async signIn(
    signInData: SignInRequestType,
    userAgent: string,
  ): Promise<SignInResponseType> {
    const DUMMY_BCRYPT_HASH =
      "$2b$12$KIXIDG6Z9G2FZ8mDkP3hXuJX8LxT9F5xqRzB7Aq1v4sNn8c6mZ2yG";

    const user = await userRepository.findOne({
      where: {
        username: ILike(signInData.username),
        isActive: true,
        deletedAt: IsNull(),
      },
    });

    const passwordHash = user?.hashedPassword ?? DUMMY_BCRYPT_HASH;

    const passwordValid = await bcrypt.compare(
      signInData.password,
      passwordHash,
    );

    if (!user || !passwordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (user.is2faEnabled) {
      const verificationTokenTTL = jwtSecurity.generateTokenTTL(
        30,
        TTLUnit.MINUTES,
      );

      const verificationTokenPayload: ITwoFaVerificationPayload = {
        id: user.id,
        tokenCategory: TokenCategoryEnum.TWO_FA_VERIFICATION,
      };

      const verificationToken = jwtSecurity.generateToken(
        verificationTokenPayload,
        verificationTokenTTL,
      );

      await authCacheService.cacheAuthValue({
        identifier: user.id,
        category: AuthCategoryEnum.TWO_FA_VERIFICATION,
        value: verificationToken,
        ttlSeconds: verificationTokenTTL,
      });

      return {
        data: {
          token: verificationToken,
          is2faEnabled: true,
        },
      };
    }

    const tokenTTL = jwtSecurity.generateTokenTTL(7, TTLUnit.DAYS);
    const token = jwtSecurity.generateToken(
      { id: user.id, tokenCategory: TokenCategoryEnum.LOGIN },
      tokenTTL,
    );

    const fingerprintHash = clientHeuristicFingerprint.generateHash(userAgent);

    await authCacheService.cacheLoginSession({
      identifier: user.id,
      token,
      fingerprintHash,
      ttlSeconds: tokenTTL,
    });

    return {
      data: {
        token,
        is2faEnabled: false,
      },
    };
  }

  async verifyTwoFactorAuthenticationSignIn(
    token: string,
    options: { code: string },
    userAgent: string,
  ): Promise<VerifyTwoFactorAuthenticationSignInResponseType> {
    const decodedToken =
      jwtSecurity.verifyAndDecodeToken<ITwoFaVerificationPayload>(token);

    const { id, tokenCategory } = decodedToken;

    const bruteForceProtectionSecurity = new BruteForceProtectionSecurity();
    const twoFactorAuthenticationSecurity =
      new TwoFactorAuthenticationSecurity();

    await bruteForceProtectionSecurity.ensureAllowed(id);

    if (tokenCategory !== TokenCategoryEnum.TWO_FA_VERIFICATION) {
      throw new UnauthorizedError("Invalid verification token");
    }

    const authValue = await authCacheService.getCachedAuthValue({
      identifier: id,
      category: AuthCategoryEnum.TWO_FA_VERIFICATION,
    });

    if (!authValue) {
      throw new UnauthorizedError("Verification session expired or invalid");
    }

    if (authValue !== token) {
      throw new UnauthorizedError("Invalid or mismatched verification token");
    }

    const user = await userRepository.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedError("User does not exist");
    }

    const cleanedCode = options.code.trim().replace(/\s+/g, "");
    const isValidTwoFaCode =
      await twoFactorAuthenticationSecurity.isCodeVerified({
        id: user.id,
        username: user.username,
        code: cleanedCode,
      });

    if (!isValidTwoFaCode) {
      await bruteForceProtectionSecurity.recordFailure(id);
      throw new UnauthorizedError(
        "Invalid or expired two factor authentication code",
      );
    }

    const authPayload: ILoginPayload = {
      id: user.id,
      tokenCategory: TokenCategoryEnum.LOGIN,
    };

    const authTokenTTL = jwtSecurity.generateTokenTTL(7, TTLUnit.DAYS);
    const authToken = jwtSecurity.generateToken(authPayload, authTokenTTL);

    const fingerprintHash = clientHeuristicFingerprint.generateHash(userAgent);

    await authCacheService.invalidateCachedAuthValue({
      identifier: id,
      category: AuthCategoryEnum.TWO_FA_VERIFICATION,
    });

    await authCacheService.cacheLoginSession({
      identifier: id,
      token: authToken,
      fingerprintHash,
      ttlSeconds: authTokenTTL,
    });

    await bruteForceProtectionSecurity.clearFailures(id);
    return {
      data: authToken,
    };
  }

  async setupTwoFactorAuthentication(
    id: string,
  ): Promise<SetupTwoFactorAuthenticationResponseType> {
    const twoFactorAuthenticationSecurity =
      new TwoFactorAuthenticationSecurity();

    const user = await userRepository.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedError("User does not exist");
    }

    if (user.is2faEnabled) {
      throw new BadRequestError(
        "Two factor authentication is already enabled on this account",
      );
    }

    const qRUri = twoFactorAuthenticationSecurity.generateQRUri({
      id: user.id,
      username: user.username,
    });
    const secret = twoFactorAuthenticationSecurity.generateSecret({
      id: user.id,
      username: user.username,
    });

    return {
      data: {
        qRUri,
        secret,
      },
    };
  }

  async verifyTwoFactorAuthenticationCodeAndGenerateRecoveryCodes(
    id: string,
    options: TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesRequestType,
  ): Promise<TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesResponseType> {
    const twoFactorAuthenticationSecurity =
      new TwoFactorAuthenticationSecurity();

    const user = await userRepository.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedError("User does not exist");
    }

    if (user.is2faEnabled) {
      throw new BadRequestError(
        "Two factor authentication is already enabled on this account",
      );
    }

    const isValidTwoFaCode =
      await twoFactorAuthenticationSecurity.isCodeVerified({
        id: user.id,
        username: user.username,
        code: options.code.trim().replace(/\s+/g, ""),
      });

    if (!isValidTwoFaCode) {
      throw new UnauthorizedError("Invalid or expired OTP code");
    }

    const recoveryCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(3).toString("hex").toUpperCase();
      recoveryCodes.push(code);
    }

    const hashedRecoveryCodes: string[] = [];
    for (const code of options.recoveryCodes) {
      const hashed = await bcrypt.hash(code, 10);
      hashedRecoveryCodes.push(hashed);
    }

    await authCacheService.cacheAuthValue({
      identifier: id,
      category: AuthCategoryEnum.TWO_FA_RECOVERY_CODES,
      value: JSON.stringify(hashedRecoveryCodes),
      ttlSeconds: jwtSecurity.generateTokenTTL(30, TTLUnit.MINUTES),
    });

    return {
      data: {
        recoveryCodes,
      },
    };
  }

  async saveGeneratedRecoveryCodes(
    id: string,
  ): Promise<SaveRecoveryCodesResponseType> {
    const user = await userRepository.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedError("User does not exist");
    }

    if (user.is2faEnabled) {
      throw new BadRequestError(
        "Two factor authentication is already enabled on this account",
      );
    }

    const authValue = await authCacheService.getCachedAuthValue({
      identifier: id,
      category: AuthCategoryEnum.TWO_FA_RECOVERY_CODES,
    });

    if (!authValue) {
      throw new InternalServerError("Recovery codes not found");
    }

    const hashedRecoveryCodes: string[] = JSON.parse(authValue);

    const updatedUser = await userRepository.updateRecord({
      where: { id: user.id },
      data: {
        hashedRecoveryCodes,
        is2faEnabled: true,
      },
    });

    if (!updatedUser) {
      throw new InternalServerError(
        "Failed to enable 2FA or store recovery codes",
      );
    }

    const tokenTTL = jwtSecurity.generateTokenTTL(7, TTLUnit.DAYS);
    const tokenPayload: ILoginPayload = {
      id: user.id,
      tokenCategory: TokenCategoryEnum.LOGIN,
    };

    // Token is generated for potential future use (e.g., auto-login after 2FA setup)
    jwtSecurity.generateToken(tokenPayload, tokenTTL);

    await authCacheService.invalidateCachedAuthValue({
      identifier: user.id,
      category: AuthCategoryEnum.BRUTE_FORCE_PROTECTION,
    });

    return {
      data: "Two factor authentication enabled successfully",
    };
  }

  async disableTwoFactorAuthentication(
    id: string,
    options: DisableTwoFactorAuthenticationRequestType,
  ): Promise<DisableTwoFactorAuthenticationResponseType> {
    const bruteForceProtectionSecurity = new BruteForceProtectionSecurity();

    const user = await userRepository.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedError("User does not exist");
    }

    if (!user.is2faEnabled) {
      throw new BadRequestError(
        "Two factor authentication is not enabled on this account",
      );
    }

    const cleanedCode = options.code.trim().replace(/\s+/g, "");
    const isValid2FA = await this.isValidCode(
      {
        id: user.id,
        username: user.username,
        hashedRecoveryCodes: user.hashedRecoveryCodes,
      },
      cleanedCode,
    );

    if (!isValid2FA) {
      await bruteForceProtectionSecurity.recordFailure(user.id);
      throw new UnauthorizedError("Invalid authentication or recovery code");
    }

    const updatedUser = await userRepository.updateRecord({
      where: { id: user.id },
      data: {
        is2faEnabled: false,
        hashedRecoveryCodes: [],
      },
    });

    if (!updatedUser) {
      throw new InternalServerError("Failed to disable 2FA");
    }

    await bruteForceProtectionSecurity.clearFailures(user.id);

    return {
      data: "Two factor authentication disabled successfully",
    };
  }

  async logout(options: {
    id: string;
    userAgent: string;
    allSessions: boolean;
  }): Promise<LogoutResponseType> {
    const user = await userRepository.findOne({
      where: { id: options.id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedError("User does not exist");
    }

    if (options.allSessions) {
      await authCacheService.logoutAllSessions(user.id);
      return {
        data: "Logged out successfully",
      };
    }

    const fingerprintHash = clientHeuristicFingerprint.generateHash(
      options.userAgent,
    );
    await authCacheService.logoutSession({
      identifier: user.id,
      fingerprintHash,
    });

    return {
      data: "Logged out successfully",
    };
  }

  private async isValidCode(
    user: {
      id: string;
      username: string;
      hashedRecoveryCodes: string[] | null;
    },
    code: string,
  ): Promise<boolean> {
    const twoFactorAuthenticationSecurity =
      new TwoFactorAuthenticationSecurity();

    if (
      await twoFactorAuthenticationSecurity.isCodeVerified({
        id: user.id,
        username: user.username,
        code,
      })
    ) {
      return true;
    }

    if (!user.hashedRecoveryCodes || user.hashedRecoveryCodes.length === 0) {
      return false;
    }

    const comparisons: Promise<boolean>[] = user.hashedRecoveryCodes.map(
      (hash) => bcrypt.compare(code, hash),
    );

    const results = await Promise.all(comparisons);
    return results.some((match) => match === true);
  }
}
