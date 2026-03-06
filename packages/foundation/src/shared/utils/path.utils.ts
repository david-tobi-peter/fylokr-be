import { fileURLToPath } from "url";
import { dirname } from "path";

/**
 * @param importMetaUrl
 * @returns {__filename: string; __dirname: string}
 */
export function getPathDetails(importMetaUrl: string): {
  __filename: string;
  __dirname: string;
} {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = dirname(__filename);

  return { __filename, __dirname };
}
