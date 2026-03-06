/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorHandler } from "#foundation/errors/index.js";
import type { Response } from "express";
import { Container } from "typedi";
import type { IErrorConfig } from "#foundation/shared/interfaces/index.js";

export default function Controller() {
  return function <T extends new (...args: any[]) => any>(target: T): T {
    return class extends target {
      constructor(...args: any[]) {
        super(...args);

        const proto = target.prototype;

        for (const name of Object.getOwnPropertyNames(proto)) {
          if (name === "constructor") continue;

          const fn = this[name];
          if (typeof fn !== "function") continue;

          if ((fn as any).__bound) continue;

          const bound = async (...args: any[]) => {
            try {
              return await fn.apply(this, args);
            } catch (err) {
              const res = args[1] as Response | undefined;

              if (res) {
                let errorConfig: IErrorConfig;
                try {
                  errorConfig = Container.get<IErrorConfig>("IErrorConfig");
                } catch {
                  errorConfig = { isVerbose: false };
                }
                ErrorHandler.handleError(err, res, errorConfig);
              } else {
                throw err;
              }
            }
          };

          Object.defineProperty(bound, "__bound", { value: true });

          Object.defineProperty(bound, "name", {
            value: name,
            configurable: true,
          });

          this[name] = bound;
        }
      }
    };
  };
}
