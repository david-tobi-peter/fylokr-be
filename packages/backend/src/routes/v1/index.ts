import express from "express";
import swaggerUi from "swagger-ui-express";
import type { Request, Response, NextFunction } from "express";
import { createAuthRouter } from "./auth.routes.js";
import { openapiSpec } from "#backend/spec/v1/index.js";

export function createV1Router(): express.Router {
  const router = express.Router();

  router.use("/auth", createAuthRouter());

  router.use(
    "/documentation",
    swaggerUi.serve,
    (req: Request, res: Response, next: NextFunction) => {
      return swaggerUi.setup(openapiSpec)(req, res, next);
    },
  );

  return router;
}
