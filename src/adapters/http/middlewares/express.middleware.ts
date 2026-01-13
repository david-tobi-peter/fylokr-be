import type { NextFunction, Request, Response } from "express";
import type { APIResponseType } from "#/shared/types/api";
import type { ERROR_TYPE_ENUM } from "#/shared/enums";

interface IErrorResponse {
  statusCode: number;
  error: {
    type: ERROR_TYPE_ENUM;
    message: string;
  };
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Response {
      ok: (response: APIResponseType) => void;
      created: (response: APIResponseType) => void;
      noContent: () => void;
    }

    interface Response {
      sendErrorResponse: (serviceResponse: IErrorResponse) => void;
    }

    interface Request {
      user?: { id: string };
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function handleSuccessResponse(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const sendJson = (payload: APIResponseType, status: number) => {
    if (res.headersSent) return;
    return res.status(status).json(payload);
  };

  res.ok = (response: APIResponseType) =>
    sendJson(
      response.metadata
        ? { data: response.data, metadata: response.metadata }
        : { data: response.data },
      200,
    );

  res.created = (response: APIResponseType) =>
    sendJson(
      response.metadata
        ? { data: response.data, metadata: response.metadata }
        : { data: response.data },
      201,
    );

  res.noContent = () => res.status(204).send();

  next();
}

export function handleErrorResponse(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.sendErrorResponse = (err: IErrorResponse) => {
    if (res.headersSent) return;

    const { statusCode, error } = err;
    return res.status(statusCode).json({ error });
  };

  next();
}
