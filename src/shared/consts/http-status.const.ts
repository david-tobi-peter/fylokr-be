import { ERROR_TYPE_ENUM } from "../enums/error-type.enum.js";

export const ERROR_STATUS_CODES: Record<ERROR_TYPE_ENUM, number> = {
  [ERROR_TYPE_ENUM.BAD_REQUEST]: 400,
  [ERROR_TYPE_ENUM.UNAUTHORIZED]: 401,
  [ERROR_TYPE_ENUM.FORBIDDEN]: 403,
  [ERROR_TYPE_ENUM.NOT_FOUND]: 404,
  [ERROR_TYPE_ENUM.FILE_NOT_FOUND]: 404,
  [ERROR_TYPE_ENUM.REQUEST_TIMEOUT]: 408,
  [ERROR_TYPE_ENUM.RESOURCE_CONFLICT]: 409,
  [ERROR_TYPE_ENUM.VALIDATION_ERROR]: 422,
  [ERROR_TYPE_ENUM.CONFIGURATION_ERROR]: 500,
  [ERROR_TYPE_ENUM.USER_AGENT_NOT_FOUND]: 400,
  [ERROR_TYPE_ENUM.DATABASE_ERROR]: 500,
  [ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_TYPE_ENUM.SERVICE_UNAVAILABLE]: 503,
} as const;

export const SUCCESS_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
} as const;

export const ERROR_TYPE_DEFAULTS: { [key in ERROR_TYPE_ENUM]: string } = {
  [ERROR_TYPE_ENUM.VALIDATION_ERROR]:
    "Validation failed for the provided data.",
  [ERROR_TYPE_ENUM.BAD_REQUEST]: "The request was missing required parameters.",
  [ERROR_TYPE_ENUM.NOT_FOUND]: "The requested resource could not be found.",
  [ERROR_TYPE_ENUM.FILE_NOT_FOUND]: "File does not exist",
  [ERROR_TYPE_ENUM.CONFIGURATION_ERROR]: "Configuration error occurred.",
  [ERROR_TYPE_ENUM.USER_AGENT_NOT_FOUND]: "User agent header missing.",
  [ERROR_TYPE_ENUM.DATABASE_ERROR]: "A database related error.",
  [ERROR_TYPE_ENUM.UNAUTHORIZED]:
    "You do not have the necessary permissions to carry out this operation.",
  [ERROR_TYPE_ENUM.RESOURCE_CONFLICT]:
    "A conflict occurred, preventing the creation, update, or deletion of the resource.",
  [ERROR_TYPE_ENUM.INTERNAL_SERVER_ERROR]:
    "An unexpected error occurred. Please try again later.",
  [ERROR_TYPE_ENUM.REQUEST_TIMEOUT]: "Request time out.",
  [ERROR_TYPE_ENUM.FORBIDDEN]:
    "You don't have permission to access this resource. Request for access.",
  [ERROR_TYPE_ENUM.SERVICE_UNAVAILABLE]:
    "The service is temporarily unavailable. Please try again later.",
} as const;
