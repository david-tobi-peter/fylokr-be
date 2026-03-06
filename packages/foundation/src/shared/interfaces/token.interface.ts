import { TokenCategoryEnum } from "#foundation/shared/enums/index.js";

export interface IJwtClaims {
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface ILoginPayload {
  id: string;
  tokenCategory: typeof TokenCategoryEnum.LOGIN;
}

export interface ISignupPayload {
  id: string;
  tokenCategory: typeof TokenCategoryEnum.SIGNUP;
}

export interface ITwoFaVerificationPayload {
  id: string;
  tokenCategory: typeof TokenCategoryEnum.TWO_FA_VERIFICATION;
}
