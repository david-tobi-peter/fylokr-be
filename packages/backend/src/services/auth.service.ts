import { Service } from "typedi";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ILike, IsNull } from "typeorm";
import { userRepository } from "#backend/repositories/index.js";
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
} from "#backend/spec/api/index.js";
import {
  BadRequestError,
  InternalServerError,
  ResourceConflictError,
  UnauthorizedError,
  BruteForceProtectionSecurity,
  ClientHeuristicFingerprint,
  JwtSecurity,
  TwoFactorAuthenticationSecurity,
  AuthCategoryEnum,
  TokenCategoryEnum,
  TTLUnit,
  AuthCacheService,
  type ILoginPayload,
  type ITwoFaVerificationPayload,
} from "@david-tobi-peter/foundation";

@Service()
export class AuthService {
  constructor(
    private readonly bruteForceProtection: BruteForceProtectionSecurity,
    private readonly twoFactorAuthentication: TwoFactorAuthenticationSecurity,
    private readonly fingerprint: ClientHeuristicFingerprint,
    private readonly jwt: JwtSecurity,
    private readonly authCache: AuthCacheService,
  ) {}
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

    const tokenTTL = this.jwt.generateTokenTTL(7, TTLUnit.DAYS);
    const token = this.jwt.generateToken(
      { id: newUser.id, tokenCategory: TokenCategoryEnum.LOGIN },
      tokenTTL,
    );

    const fingerprintHash = this.fingerprint.generateHash(userAgent);

    await this.authCache.cacheLoginSession({
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

    const passwordHash = user?.hashedPassword.toString() ?? DUMMY_BCRYPT_HASH;

    const passwordValid = await bcrypt.compare(
      signInData.password,
      passwordHash,
    );

    if (!user || !passwordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (user.is2faEnabled) {
      const verificationTokenTTL = this.jwt.generateTokenTTL(
        30,
        TTLUnit.MINUTES,
      );

      const verificationTokenPayload: ITwoFaVerificationPayload = {
        id: user.id,
        tokenCategory: TokenCategoryEnum.TWO_FA_VERIFICATION,
      };

      const verificationToken = this.jwt.generateToken(
        verificationTokenPayload,
        verificationTokenTTL,
      );

      await this.authCache.cacheAuthValue({
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

    const tokenTTL = this.jwt.generateTokenTTL(7, TTLUnit.DAYS);
    const token = this.jwt.generateToken(
      { id: user.id, tokenCategory: TokenCategoryEnum.LOGIN },
      tokenTTL,
    );

    const fingerprintHash = this.fingerprint.generateHash(userAgent);

    await this.authCache.cacheLoginSession({
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

  /**
   * @param {string} token
   * @param {Object} options
   * @param {string} options.code
   * @param {string} userAgent
   * @returns {Promise<VerifyTwoFactorAuthenticationSignInResponseType>}
   */
  async verifyTwoFactorAuthenticationSignIn(
    token: string,
    options: { code: string },
    userAgent: string,
  ): Promise<VerifyTwoFactorAuthenticationSignInResponseType> {
    const decodedToken =
      this.jwt.verifyAndDecodeToken<ITwoFaVerificationPayload>(token);

    const { id, tokenCategory } = decodedToken;

    await this.bruteForceProtection.ensureAllowed(id);

    if (tokenCategory !== TokenCategoryEnum.TWO_FA_VERIFICATION) {
      throw new UnauthorizedError("Invalid verification token");
    }

    const authValue = await this.authCache.getCachedAuthValue({
      identifier: id,
      category: AuthCategoryEnum.TWO_FA_VERIFICATION,
    });

    if (!authValue || authValue !== token) {
      throw new UnauthorizedError("Verification session expired or invalid");
    }

    const user = await userRepository.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedError("User does not exist");
    }

    const isValidTwoFaCode =
      await this.twoFactorAuthentication.isValidTwoFACode({
        id: user.id,
        username: user.username,
        code: options.code,
        hashedRecoveryCodes: user.hashedRecoveryCodes,
      });

    if (!isValidTwoFaCode) {
      await this.bruteForceProtection.recordFailure(id);
      throw new UnauthorizedError(
        "Invalid or expired two factor authentication code",
      );
    }

    const authPayload: ILoginPayload = {
      id: user.id,
      tokenCategory: TokenCategoryEnum.LOGIN,
    };

    const authTokenTTL = this.jwt.generateTokenTTL(7, TTLUnit.DAYS);
    const authToken = this.jwt.generateToken(authPayload, authTokenTTL);

    const fingerprintHash = this.fingerprint.generateHash(userAgent);

    await this.authCache.invalidateCachedAuthValue({
      identifier: id,
      category: AuthCategoryEnum.TWO_FA_VERIFICATION,
    });

    await this.authCache.cacheLoginSession({
      identifier: id,
      token: authToken,
      fingerprintHash,
      ttlSeconds: authTokenTTL,
    });

    await this.bruteForceProtection.clearFailures(id);
    return {
      data: authToken,
    };
  }

  /**
   * @param {string} id
   * @returns {Promise<SetupTwoFactorAuthenticationResponseType>}
   */
  async setupTwoFactorAuthentication(
    id: string,
  ): Promise<SetupTwoFactorAuthenticationResponseType> {
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

    const qRUri = this.twoFactorAuthentication.generateQRUri({
      id: user.id,
      username: user.username,
    });
    const secret = this.twoFactorAuthentication.generateSecret({
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

  /**
   * @param {string} id
   * @param {TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesRequestType} options
   * @returns {Promise<TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesResponseType>}
   */
  async verifyTwoFactorAuthenticationCodeAndGenerateRecoveryCodes(
    id: string,
    options: TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesRequestType,
  ): Promise<TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesResponseType> {
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
      await this.twoFactorAuthentication.isValidTwoFACode({
        id: user.id,
        username: user.username,
        code: options.code,
        hashedRecoveryCodes: user.hashedRecoveryCodes,
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
    for (const code of recoveryCodes) {
      const hashed = await bcrypt.hash(code, 10);
      hashedRecoveryCodes.push(hashed);
    }

    await this.authCache.cacheAuthValue({
      identifier: id,
      category: AuthCategoryEnum.TWO_FA_RECOVERY_CODES,
      value: JSON.stringify(hashedRecoveryCodes),
      ttlSeconds: this.jwt.generateTokenTTL(30, TTLUnit.MINUTES),
    });

    return {
      data: {
        recoveryCodes,
      },
    };
  }

  /**
   * @param {string} id
   * @param {string} userAgent
   * @returns {Promise<SaveRecoveryCodesResponseType>}
   */
  async saveGeneratedRecoveryCodes(
    id: string,
    userAgent: string,
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

    const authValue = await this.authCache.getCachedAuthValue({
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

    const tokenTTL = this.jwt.generateTokenTTL(7, TTLUnit.DAYS);
    const tokenPayload: ILoginPayload = {
      id: user.id,
      tokenCategory: TokenCategoryEnum.LOGIN,
    };

    const authToken = this.jwt.generateToken(tokenPayload, tokenTTL);

    await this.authCache.invalidateCachedAuthValue({
      identifier: user.id,
      category: AuthCategoryEnum.TWO_FA_RECOVERY_CODES,
    });

    const fingerprintHash = this.fingerprint.generateHash(userAgent);

    await this.authCache.cacheLoginSession({
      identifier: user.id,
      token: authToken,
      fingerprintHash,
      ttlSeconds: tokenTTL,
    });

    return {
      data: {
        token: authToken,
        is2faEnabled: true,
      },
    };
  }

  /**
   * @param {string} id
   * @param {DisableTwoFactorAuthenticationRequestType} options
   * @returns {Promise<DisableTwoFactorAuthenticationResponseType>}
   */
  async disableTwoFactorAuthentication(
    id: string,
    options: DisableTwoFactorAuthenticationRequestType,
  ): Promise<DisableTwoFactorAuthenticationResponseType> {
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

    const isValid2FA = await this.twoFactorAuthentication.isValidTwoFACode({
      id: user.id,
      username: user.username,
      code: options.code,
      hashedRecoveryCodes: user.hashedRecoveryCodes,
    });

    if (!isValid2FA) {
      await this.bruteForceProtection.recordFailure(user.id);
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

    await this.bruteForceProtection.clearFailures(user.id);

    return {
      data: "Two factor authentication disabled successfully",
    };
  }

  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.userAgent
   * @param {boolean} options.shouldLogoutFromAllSessions
   * @returns {Promise<LogoutResponseType>}
   */
  async logout(options: {
    id: string;
    userAgent: string;
    shouldLogoutFromAllSessions: boolean;
  }): Promise<LogoutResponseType> {
    const user = await userRepository.findOne({
      where: { id: options.id, isActive: true, deletedAt: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedError("User does not exist");
    }

    if (options.shouldLogoutFromAllSessions) {
      await this.authCache.logoutAllSessions(user.id);
      return {
        data: "Logged out successfully",
      };
    }

    const fingerprintHash = this.fingerprint.generateHash(options.userAgent);
    await this.authCache.logoutSession({
      identifier: user.id,
      fingerprintHash,
    });

    return {
      data: "Logged out successfully",
    };
  }
}
