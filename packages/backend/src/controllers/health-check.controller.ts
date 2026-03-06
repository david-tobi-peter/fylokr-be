import { Container, Service } from "typedi";
import type { Request, Response } from "express";
import { Controller } from "@david-tobi-peter/foundation";
import { HealthCheckService } from "#backend/services/index.js";

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
