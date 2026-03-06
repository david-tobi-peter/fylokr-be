import type { Application } from "express";
import {
  FoundationApplication,
  initializeDatabase,
} from "@david-tobi-peter/foundation";
import type {
  IAppOptions,
  IFoundationConfig,
} from "@david-tobi-peter/foundation";
import { RouteManager } from "#backend/routes/index.js";

export class App extends FoundationApplication {
  constructor(
    engine: Application,
    config: IFoundationConfig,
    options?: IAppOptions,
  ) {
    super(engine, config, options);
  }

  protected async setupDependencies(): Promise<void> {
    await initializeDatabase();
  }

  protected installRoutes(): void {
    RouteManager.registerRoutes(this.engine);
  }
}
