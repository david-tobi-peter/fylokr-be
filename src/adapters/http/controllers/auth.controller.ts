import type { Request, Response } from "express";
import { Container, Service } from "typedi";
import type { SignUpRequestType } from "#/shared/types/api";
import { AuthService } from "#/core/services";
import { Controller } from "#/adapters/http/decorators";

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
      throw new Error("Passwords do not match");
    }

    const result = await this.authService.signUp(payload);
    res.created(result);
  }
}
