import { TokenCategoryEnum } from "#/shared/enums";

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
  email: string;
  tokenCategory: typeof TokenCategoryEnum.SIGNUP;
}
