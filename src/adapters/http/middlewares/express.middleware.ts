import type { NextFunction, Response, Request } from "express";
import type { APIResponseType } from "#/shared/types/api";

export function handleSuccessResponse(
  _req: Request,
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
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  res.sendErrorResponse = (err) => {
    if (res.headersSent) return;

    const { statusCode, error } = err;
    return res.status(statusCode).json({ error });
  };

  next();
}
