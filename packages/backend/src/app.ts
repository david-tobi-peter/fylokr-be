import type { Application } from "express";
import {
  FoundationApplication,
  createDatabase,
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
    createDatabase(this.config.db, this.config.logger);
    await initializeDatabase();
  }

  protected installRoutes(): void {
    RouteManager.registerRoutes(this.engine);
  }
}
