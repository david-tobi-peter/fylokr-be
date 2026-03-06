import type { Response } from "express";
import { QueryFailedError } from "typeorm";
import config from "#/config";
import { Logger } from "#/infra/logger";
import { BaseError } from "./base.error.js";
import { DatabaseError, InternalServerError } from "./system.error.js";

export class ErrorHandler {
  /**
   * @param {unknown} error
   * @param {Response} res
   * @returns {void}
   */
  static handleError(error: unknown, res: Response): void {
    const normalizedError = this.normalizeError(error);

    const logObject = normalizedError.toLogObject(
      normalizedError.statusCode >= 500,
    );
    Logger.error(`[${normalizedError.type}]`, logObject);

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
   * @returns {BaseError}
   */
  private static normalizeError(error: unknown): BaseError {
    if (error instanceof BaseError) {
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
