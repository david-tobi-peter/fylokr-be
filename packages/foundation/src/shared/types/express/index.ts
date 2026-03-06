import type { APIResponseType } from "#foundation/shared/types/api/index.js";
import type { ERROR_TYPE_ENUM } from "#foundation/shared/enums/index.js";

interface IErrorResponse {
  statusCode: number;
  error: {
    type: ERROR_TYPE_ENUM;
    message: string;
  };
}

declare module "express-serve-static-core" {
  export interface Response {
    ok: (response: APIResponseType) => void;
    created: (response: APIResponseType) => void;
    noContent: () => void;
    sendErrorResponse: (serviceResponse: IErrorResponse) => void;
  }

  export interface Request {
    user?: { id: string };
    verificationToken?: string;
  }
}

export {};
