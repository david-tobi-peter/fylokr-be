import { openapiSpec } from "#/adapters/http/documentation";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { Logger } from "#/infra/logger";
import { getPathDetails } from "#/shared/utils";

const { __dirname } = getPathDetails(import.meta.url);

const specFile = join(
  __dirname,
  "../adapters/http/documentation/v1/generated/api-spec.json",
);
const specDir = join(__dirname, "../adapters/http/documentation/v1/generated");
const generatedTypesDir = join(__dirname, "../shared/types/api/generated");
const outputFile = join(generatedTypesDir, "api-types.d.ts");
const openapiCommand = `npx openapi-typescript@latest "${specFile}" --output "${outputFile}"`;

try {
  if (existsSync(specDir)) {
    mkdirSync(specDir, { recursive: true });
  }

  Logger.info(`Writing API spec to: ${specFile}`);
  writeFileSync(specFile, JSON.stringify(openapiSpec, null, 2));

  if (existsSync(generatedTypesDir)) {
    mkdirSync(generatedTypesDir, { recursive: true });
  }

  Logger.info("Generating TypeScript types from OpenAPI spec...");
  execSync(openapiCommand, { stdio: "inherit" });

  Logger.info(`Generated TypeScript types: ${outputFile}`);
} catch (error) {
  console.error(`\nAn error occurred while generating API types: ${error}`);
  process.exit(1);
}
