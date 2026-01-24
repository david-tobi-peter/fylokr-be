import path from "node:path";
import { getPathDetails } from "#/shared/utils";
import type { Application, NextFunction, Response } from "express";
import { middleware as apiValidation } from "express-openapi-validator";
import bodyParser from "body-parser";
import cors from "cors";
import {
  handleErrorResponse,
  handleSuccessResponse,
} from "#/adapters/http/middlewares";
import v1Router from "./v1/index.js";
import rootRouter from "./root.route.js";
import { ERROR_STATUS_CODES } from "#/shared/consts";
import { ERROR_TYPE_ENUM } from "#/shared/enums";

const { __dirname } = getPathDetails(import.meta.url);
const apiSpec = path.resolve(
  __dirname,
  "../../../adapters/http/documentation/v1/generated/api-spec.json",
);

/**
 * @class RouteManager
 * @classdesc
 */
export class RouteManager {
  /**
   * @param {Application} app
   */
  static registerRoutes(app: Application) {
    app.use(
      bodyParser.json({
        limit: "50mb",
      }),
    );

    app.use(cors());
    app.use(handleSuccessResponse);
    app.use(handleErrorResponse);

    app.use(
      "/v1",
      apiValidation({
        apiSpec,
        validateRequests: true,
        validateResponses: true,
        ignorePaths: /\/documentation/,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      (err: any, _: any, res: Response, _next: NextFunction) => {
        res
          .status(err.status || ERROR_STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({
            error: {
              type: ERROR_TYPE_ENUM.VALIDATION_ERROR,
              message: err.message,
              errors: err.errors,
            },
          });
      },
    );

    app.use("/", rootRouter);
    app.use("/v1", v1Router);
  }
}
