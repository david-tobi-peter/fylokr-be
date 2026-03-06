import type { Application } from "express";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import { Logger } from "#foundation/logger/index.js";
import type {
  IAppOptions,
  IFoundationConfig,
} from "#foundation/shared/interfaces/index.js";

/**
 * @abstract
 * @class FoundationApplication
 */
export abstract class FoundationApplication {
  protected engine: Application;
  protected port: number;
  protected options: IAppOptions;
  protected config: IFoundationConfig;
  protected connection?: http.Server;

  constructor(
    engine: Application,
    config: IFoundationConfig,
    options?: IAppOptions,
  ) {
    this.engine = engine;
    this.config = config;
    this.port = config.app.PORT;
    this.options = options || {};
  }

  protected abstract setupDependencies(): Promise<void>;

  protected abstract installRoutes(): void;

  protected configure(): void {
    const {
      urlEncodeExtended = true,
      requestSizeLimit = "20mb",
      cors: corsOption,
    } = this.options;

    this.engine.use((_req, res, next) => {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      next();
    });

    this.engine.set("trust proxy", true);
    this.engine.use(helmet());
    this.engine.use(helmet.hidePoweredBy());
    this.engine.use(cookieParser());
    this.engine.use(cors(corsOption));
    this.engine.use(express.json({ limit: requestSizeLimit }));

    this.engine.use(
      express.urlencoded({
        limit: requestSizeLimit,
        extended: urlEncodeExtended,
      }),
    );

    if (!this.config.app.isProduction) {
      this.engine.use(morgan("tiny"));
    }

    this.installRoutes();
  }

  async initialize() {
    await this.setupDependencies();
    this.configure();
  }

  run(): void {
    this.connection = this.engine.listen(this.port, () => {
      Logger.info(`App now running on port ${this.port}`);
    });
  }

  close() {
    this.connection?.close();
  }
}
