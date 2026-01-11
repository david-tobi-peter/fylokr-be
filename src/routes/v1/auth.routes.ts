import { Router } from "express";
import { Container } from "typedi";
import { AuthController } from "#/controllers";

const controller = Container.get(AuthController);

const router = Router();

router.route("/sign-up").post(controller.signUp);

export default router;
