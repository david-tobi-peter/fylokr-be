import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (stack) logMessage += `\n${stack}`;
  return logMessage;
});

const logDir = path.resolve(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

class LoggerService {
  private static instance: winston.Logger;

  private constructor() {}

  public static getInstance(): winston.Logger {
    if (!LoggerService.instance) {
      const transports: winston.transport[] = [
        new DailyRotateFile({
          dirname: logDir,
          filename: "app-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxFiles: "14d",
          level: "info",
        }),
        new winston.transports.Console({
          level: "debug",
          format: logFormat,
        }),
      ];

      LoggerService.instance = winston.createLogger({
        level: "info",
        format: combine(timestamp({ format: "HH:mm:ss" }), logFormat),
        transports,
      });
    }

    return LoggerService.instance;
  }
}

export const Logger = LoggerService.getInstance();
