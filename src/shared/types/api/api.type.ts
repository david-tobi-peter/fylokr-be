import type { paths, components } from "./generated/api-types.js";

type APIResponse<
  P extends keyof paths,
  M extends keyof paths[P],
  S extends keyof (paths[P][M] extends { responses: unknown }
    ? paths[P][M]["responses"]
    : never),
> = P extends keyof paths
  ? M extends keyof paths[P]
    ? paths[P][M] extends { responses: unknown }
      ? S extends keyof paths[P][M]["responses"]
        ? paths[P][M]["responses"][S] extends { content: unknown }
          ? paths[P][M]["responses"][S]["content"] extends {
              "application/json": unknown;
            }
            ? paths[P][M]["responses"][S]["content"]["application/json"]
            : never
          : never
        : never
      : never
    : never
  : never;

type APIRequest<
  P extends keyof paths,
  M extends keyof paths[P],
> = P extends keyof paths
  ? M extends keyof paths[P]
    ? paths[P][M] extends {
        requestBody: { content: { "application/json": unknown } };
      }
      ? paths[P][M]["requestBody"]["content"]["application/json"]
      : never
    : never
  : never;

export type APIResponseType = components["schemas"]["APIResponseSchema"];

export type SignUpRequestType = APIRequest<"/auth/sign-up", "post">;
export type SignUpResponseType = APIResponse<"/auth/sign-up", "post", 201>;

export type SignInRequestType = APIRequest<"/auth/sign-in", "post">;
export type SignInResponseType = APIResponse<"/auth/sign-in", "post", 200>;

export type VerifyTwoFactorAuthenticationSignInRequestType = APIRequest<
  "/auth/verify-two-factor-authentication-sign-in",
  "post"
>;
export type VerifyTwoFactorAuthenticationSignInResponseType = APIResponse<
  "/auth/verify-two-factor-authentication-sign-in",
  "post",
  200
>;

export type SetupTwoFactorAuthenticationResponseType = APIResponse<
  "/auth/setup-two-factor-authentication",
  "post",
  200
>;

export type TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesRequestType =
  APIRequest<
    "/auth/verify-two-factor-authentication-and-generate-recovery-codes",
    "post"
  >;
export type TwoFactorAuthenticationVerificationAndGenerateRecoveryCodesResponseType =
  APIResponse<
    "/auth/verify-two-factor-authentication-and-generate-recovery-codes",
    "post",
    200
  >;

export type SaveRecoveryCodesResponseType = APIResponse<
  "/auth/save-recovery-codes",
  "post",
  200
>;

export type DisableTwoFactorAuthenticationRequestType = APIRequest<
  "/auth/disable-two-factor-authentication",
  "post"
>;
export type DisableTwoFactorAuthenticationResponseType = APIResponse<
  "/auth/disable-two-factor-authentication",
  "post",
  200
>;

export type LogoutResponseType = APIResponse<"/auth/logout", "post", 200>;
