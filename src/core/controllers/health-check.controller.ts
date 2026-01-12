import type { Request, Response } from "express";
import { Container, Service } from "typedi";
import { Controller } from "#/decorators";
import { HealthCheckService } from "#/services";

@Service()
@Controller()
export class HealthCheckController {
  private healthCheckService: HealthCheckService;

  constructor() {
    this.healthCheckService = Container.get(HealthCheckService);
  }

  async checkServerHealth(req: Request, res: Response) {
    const result = await this.healthCheckService.serverHealth();
    res.ok(result);
  }
}
