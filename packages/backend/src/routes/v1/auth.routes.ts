import { Router } from "express";
import { Container } from "typedi";
import { AuthController } from "#backend/controllers/index.js";
import { authentication } from "@david-tobi-peter/foundation";
import config from "#backend/config/index.js";

const controller = Container.get(AuthController);

const router = Router();

router.post("/sign-up", (req, res) => controller.signUp(req, res));
router.post("/sign-in", (req, res) => controller.signIn(req, res));
router.post("/verify-two-factor-authentication-sign-in", (req, res) =>
  controller.verifyTwoFactorAuthenticationSignIn(req, res),
);

router.post(
  "/setup-two-factor-authentication",
  authentication(config.logger, config.error),
  (req, res) => controller.setupTwoFactorAuthentication(req, res),
);
router.post(
  "/verify-two-factor-authentication-and-generate-recovery-codes",
  authentication(config.logger, config.error),
  (req, res) =>
    controller.verifyTwoFactorAuthenticationCodeAndGenerateRecoveryCodes(
      req,
      res,
    ),
);
router.post(
  "/disable-two-factor-authentication",
  authentication(config.logger, config.error),
  (req, res) => controller.disableTwoFactorAuthentication(req, res),
);

router.post(
  "/save-recovery-codes",
  authentication(config.logger, config.error),
  (req, res) => controller.saveGeneratedRecoveryCodes(req, res),
);

router.post(
  "/logout",
  authentication(config.logger, config.error),
  (req, res) => controller.logout(req, res),
);

export default router;
