export enum TTLUnit {
  SECONDS = 1,
  MINUTES = 60,
  DAYS = 86_400,
}

export const TokenCategoryEnum = {
  LOGIN: "LOGIN",
  SIGNUP: "SIGNUP",
  TWO_FA_VERIFICATION: "TWO_FA_VERIFICATION",
} as const;
