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
  TokenCategoryEnum: typeof TokenCategoryEnum.LOGIN;
}

export interface ISignupPayload {
  email: string;
  TokenCategoryEnum: typeof TokenCategoryEnum.SIGNUP;
}
