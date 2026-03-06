import { TokenCategoryEnum } from "#foundation/shared/enums/index.js";
import type {
  ITwoFaVerificationPayload,
  ILoginPayload,
  ISignupPayload,
} from "#foundation/shared/interfaces/index.js";

export type TokenCategoryEnumType =
  (typeof TokenCategoryEnum)[keyof typeof TokenCategoryEnum];

export type TokenPayloadType =
  | ILoginPayload
  | ISignupPayload
  | ITwoFaVerificationPayload;
