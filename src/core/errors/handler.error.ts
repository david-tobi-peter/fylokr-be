import type { Response } from "express";
import { QueryFailedError } from "typeorm";
import { AppError, DatabaseError, InternalServerError } from "./app.error.js";
import config from "#/config";
import { Logger } from "#/infra/logger";

export class ErrorHandler {
  /**
   * @param {unknown} error
   * @param {Response} res
   * @returns {void}
   */
  static handleError(error: unknown, res: Response): void {
    const normalizedError = this.normalizeError(error);

    if (normalizedError.shouldReport()) {
      const logObject = normalizedError.toLogObject(
        config.logger.includeStackTrace,
      );
      Logger.error(`[${normalizedError.type}]`, logObject);
    } else {
      const logObject = normalizedError.toLogObject(false);
      Logger.warn(`[${normalizedError.type}]`, logObject);
    }

    const apiObject = normalizedError.toApiObject(config.error.isVerbose);
    res.sendErrorResponse({
      statusCode: normalizedError.statusCode,
      error: apiObject,
    });
  }

  /**
   * @private
   * @static
   * @param {unknown} error
   * @returns {AppError}
   */
  private static normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (
      error instanceof QueryFailedError ||
      (typeof error === "object" && error !== null && "driverError" in error)
    ) {
      return new DatabaseError(
        error instanceof Error ? error : "Database error occurred",
      );
    }

    return new InternalServerError(
      error instanceof Error ? error : "An unknown error occurred",
    );
  }
}
