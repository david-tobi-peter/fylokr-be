import express from "express";
import { Container } from "typedi";
import { HealthCheckController } from "#backend/controllers/index.js";

const router = express.Router();
const controller = Container.get(HealthCheckController);

router.get("/", controller.checkServerHealth);

export default router;
