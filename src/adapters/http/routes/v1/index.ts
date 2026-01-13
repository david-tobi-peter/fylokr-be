import express from "express";
import swaggerUi from "swagger-ui-express";
import type { Request, Response, NextFunction } from "express";
import authRouter from "./auth.routes.js";
import { openapiSpec } from "#/adapters/http/documentation";

const router = express.Router();

router.use("/auth", authRouter);

router.use(
  "/documentation",
  swaggerUi.serve,
  (req: Request, res: Response, next: NextFunction) => {
    return swaggerUi.setup(openapiSpec)(req, res, next);
  },
);

export default router;
