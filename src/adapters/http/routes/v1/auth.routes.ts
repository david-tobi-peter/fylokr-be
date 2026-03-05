import { Router } from "express";
import { Container } from "typedi";
import { AuthController } from "#/adapters/http/controllers";
import { authentication } from "#/adapters/http/middlewares";

const controller = Container.get(AuthController);

const router = Router();

router.post("/sign-up", controller.signUp);

router.post("/sign-in", controller.signIn);
router.post(
  "/verify-two-factor-authentication-sign-in",
  controller.verifyTwoFactorAuthenticationSignIn,
);

router.post(
  "/setup-two-factor-authentication",
  authentication,
  controller.setupTwoFactorAuthentication,
);
router.post(
  "/verify-two-factor-authentication-and-generate-recovery-codes",
  authentication,
  controller.verifyTwoFactorAuthenticationCodeAndGenerateRecoveryCodes,
);
router.post(
  "/disable-two-factor-authentication",
  authentication,
  controller.disableTwoFactorAuthentication,
);

router.post(
  "/save-recovery-codes",
  authentication,
  controller.saveGeneratedRecoveryCodes,
);

router.post("/logout", authentication, controller.logout);

export default router;
