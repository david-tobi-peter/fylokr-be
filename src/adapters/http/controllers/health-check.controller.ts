import type { Request, Response } from "express";
import { Container, Service } from "typedi";
import { Controller } from "#/adapters/http/decorators";
import { HealthCheckService } from "#/core/services";

@Service()
@Controller()
export class HealthCheckController {
  private healthCheckService: HealthCheckService;

  constructor() {
    this.healthCheckService = Container.get(HealthCheckService);
  }

  async checkServerHealth(_req: Request, res: Response) {
    const result = await this.healthCheckService.serverHealth();
    res.ok(result);
  }
}
