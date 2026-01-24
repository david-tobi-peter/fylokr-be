import { Router } from "express";
import { Container } from "typedi";
import { AuthController } from "#/adapters/http/controllers";
import { userAuthentication } from "#/adapters/http/middlewares";

const controller = Container.get(AuthController);

const router = Router();

router.route("/sign-up").post(controller.signUp);
router.route("/sign-in").post(controller.signIn);
router
  .route("/verify-two-factor-authentication-sign-in")
  .post(controller.verifyTwoFactorAuthenticationSignIn);

router
  .route("/setup-two-factor-authentication")
  .post(userAuthentication, controller.setupTwoFactorAuthentication);
router
  .route("/verify-two-factor-authentication-and-generate-recovery-codes")
  .post(
    userAuthentication,
    controller.verifyTwoFactorAuthenticationCodeAndGenerateRecoveryCodes,
  );
router
  .route("/save-recovery-codes")
  .get(userAuthentication, controller.saveGeneratedRecoveryCodes);
router
  .route("/disable-two-factor-authentication")
  .post(userAuthentication, controller.disableTwoFactorAuthentication);
router.route("/logout").get(userAuthentication, controller.logout);

export default router;
