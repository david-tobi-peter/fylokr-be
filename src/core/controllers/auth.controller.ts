import type { Request, Response } from "express";
import { Container, Service } from "typedi";
import { Controller } from "#/decorators";
import type { SignUpRequestType } from "#/shared/types/api";
import { AuthService } from "#/services";

@Service()
@Controller()
export class AdminAuthController {
  constructor(private authService = Container.get(AuthService)) {}

  async signUp(req: Request, res: Response) {
    const payload: SignUpRequestType = req.body;

    if (payload.password !== payload.confirmPassword) {
      throw new Error("The password and confirmation password do not match");
    }

    const result = await this.authService.signUp(payload);

    res.created(result);
  }
}
