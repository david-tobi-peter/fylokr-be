import type { paths } from "./generated/api-types.d.ts";

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

export type SignUpRequestType = APIRequest<"/auth/signup", "post">;
export type SignUpResponseType = APIResponse<"/auth/signup", "post", 204>;

export type LoginRequestType = APIRequest<"/auth/login", "post">;
export type LoginResponseType = APIResponse<"/auth/login", "post", 200>;
