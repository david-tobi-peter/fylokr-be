import type { Response } from "express";
import { AppError, ErrorHandler } from "#/errors";

export default function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for TypeScript mixin class pattern
  return function <T extends { new (...args: any[]): any }>(target: T): T {
    return class extends target {
      properties = Object.getOwnPropertyNames(target.prototype).filter(
        (mN: string) => mN !== "constructor",
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for TypeScript mixin constructor
      constructor(...arg: any[]) {
        super(...arg);

        this.properties.forEach((member: string) => {
          if (typeof this[member] === "function") {
            this[member] = this[member].bind(this);
            const originalMethod = this[member];

            Object.defineProperty(this, member, {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Controller methods accept variable arguments
              value: async function (...props: any[]) {
                try {
                  return await originalMethod.apply(this, props);
                } catch (err: unknown) {
                  const res = props[1] as Response;

                  if (err instanceof AppError && err.stack) {
                    err.stack = `at ${target.name}.${member} (controller method)\n${err.stack}`;
                  }

                  ErrorHandler.handleError(err, res);
                }
              },
            });
          }
        });
      }
    };
  };
}
