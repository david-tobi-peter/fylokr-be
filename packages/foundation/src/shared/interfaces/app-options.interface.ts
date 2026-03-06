import type { CorsOptions } from "cors";

export interface IAppOptions {
  urlEncodeExtended?: boolean;
  requestSizeLimit?: string;
  cors?: CorsOptions;
}
