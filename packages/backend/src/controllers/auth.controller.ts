import { Service } from "typedi";
import type { Request, Response } from "express";
import { AuthService } from "#backend/services/index.js";
import type {
  SignUpRequestType,
  SignInRequestType,
  TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesRequestType,
  DisableTwoFactorAuthenticationRequestType,
} from "#backend/spec/api/index.js";
import {
  Controller,
  BadRequestError,
  UnauthorizedError,
  UserAgentNotFoundError,
} from "@david-tobi-peter/foundation";

@Service()
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async signUp(req: Request, res: Response) {
    const payload: SignUpRequestType = req.body;

    if (payload.password !== payload.confirmPassword) {
      throw new BadRequestError("Passwords do not match");
    }

    const userAgent = req.headers["user-agent"];

    if (!userAgent) {
      throw new UserAgentNotFoundError("Browser agent not found");
    }

    const result = await this.authService.signUp(payload, userAgent);
    res.created(result);
  }

  async signIn(req: Request, res: Response) {
    const payload: SignInRequestType = req.body;
    const userAgent = req.headers["user-agent"];

    if (!userAgent) {
      throw new UserAgentNotFoundError("Browser agent not found");
    }

    const result = await this.authService.signIn(payload, userAgent);
    res.ok(result);
  }

  async verifyTwoFactorAuthenticationSignIn(req: Request, res: Response) {
    const token = req.headers["x-verification-token"] as string | undefined;
    const { code } = req.body as { code: string };
    const userAgent = req.headers["user-agent"];

    if (!token) {
      throw new BadRequestError("Verification token is required");
    }

    if (!userAgent) {
      throw new UserAgentNotFoundError("Browser agent not found");
    }

    const result = await this.authService.verifyTwoFactorAuthenticationSignIn(
      token,
      { code },
      userAgent,
    );
    res.ok(result);
  }

  async setupTwoFactorAuthentication(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const result = await this.authService.setupTwoFactorAuthentication(userId);
    res.ok(result);
  }

  async verifyTwoFactorAuthenticationCodeAndGenerateRecoveryCodes(
    req: Request,
    res: Response,
  ) {
    const userId = req.user?.id;
    const payload: TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesRequestType =
      req.body;

    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const result =
      await this.authService.verifyTwoFactorAuthenticationCodeAndGenerateRecoveryCodes(
        userId,
        payload,
      );
    res.ok(result);
  }

  async saveGeneratedRecoveryCodes(req: Request, res: Response) {
    const userId = req.user?.id;
    const userAgent = req.headers["user-agent"];

    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    if (!userAgent) {
      throw new UserAgentNotFoundError("Browser agent not found");
    }

    const result = await this.authService.saveGeneratedRecoveryCodes(
      userId,
      userAgent,
    );
    res.ok(result);
  }

  async disableTwoFactorAuthentication(req: Request, res: Response) {
    const userId = req.user?.id;
    const payload: DisableTwoFactorAuthenticationRequestType = req.body;

    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const result = await this.authService.disableTwoFactorAuthentication(
      userId,
      payload,
    );
    res.ok(result);
  }

  async logout(req: Request, res: Response) {
    const userId = req.user?.id;
    const userAgent = req.headers["user-agent"];
    const shouldLogoutFromAllSessions =
      req.query["shouldLogoutFromAllSessions"] === "true";

    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    if (!userAgent) {
      throw new UserAgentNotFoundError("Browser agent not found");
    }

    const result = await this.authService.logout({
      id: userId,
      userAgent,
      shouldLogoutFromAllSessions,
    });
    res.ok(result);
  }
}
