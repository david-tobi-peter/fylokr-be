import type { APIResponseType } from "#/shared/types/api";
import type { ERROR_TYPE_ENUM } from "#/shared/enums";

interface IErrorResponse {
  statusCode: number;
  error: {
    type: ERROR_TYPE_ENUM;
    message: string;
  };
}

declare global {
  namespace Express {
    interface Response {
      ok: (response: APIResponseType) => void;
      created: (response: APIResponseType) => void;
      noContent: () => void;
      sendErrorResponse: (serviceResponse: IErrorResponse) => void;
    }

    interface Request {
      user?: { id: string };
    }
  }
}

export {};
