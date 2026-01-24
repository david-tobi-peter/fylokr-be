import type { Request, Response } from "express";
import { Container, Service } from "typedi";
import type { SignUpRequestType } from "#/shared/types/api";
import { AuthService } from "#/core/services";
import { Controller } from "#/adapters/http/decorators";
import { BadRequestError, UserAgentNotFoundError } from "#/core/errors";

@Service()
@Controller()
export class AuthController {
  private authService: AuthService;
  constructor() {
    this.authService = Container.get(AuthService);
  }

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
}
