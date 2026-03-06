export type DeepReadonly<T> = T extends (...args: unknown[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export function deepFreeze<T extends object>(obj: T): DeepReadonly<T> {
  if (Object.isFrozen(obj)) return obj as DeepReadonly<T>;

  Object.freeze(obj);

  const keys = [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ] as Array<keyof T>;

  for (const key of keys) {
    const value = obj[key];

    if (
      value &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value as object);
    }
  }

  return obj as DeepReadonly<T>;
}
