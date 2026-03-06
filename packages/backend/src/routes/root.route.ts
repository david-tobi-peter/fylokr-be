import express from "express";
import { Container } from "typedi";
import { HealthCheckController } from "#backend/controllers/index.js";

export function createRootRouter(): express.Router {
  const router = express.Router();
  const controller = Container.get(HealthCheckController);

  router.get("/", controller.checkServerHealth);

  return router;
}
