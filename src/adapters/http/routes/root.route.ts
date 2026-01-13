import express from "express";
import { Container } from "typedi";
import { HealthCheckController } from "#/adapters/http/controllers";

const router = express.Router();
const controller = Container.get(HealthCheckController);

router.get("/", controller.checkServerHealth);

export default router;
