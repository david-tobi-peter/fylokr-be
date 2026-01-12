import { TokenCategoryEnum } from "#/shared/enums";
import type { ILoginPayload, ISignupPayload } from "#/shared/interfaces";

export type TokenCategoryEnumType =
  (typeof TokenCategoryEnum)[keyof typeof TokenCategoryEnum];

export type TokenPayloadType = ILoginPayload | ISignupPayload;
