import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type OpenApiComponentsFragment = {
  components?: {
    schemas?: Record<string, unknown>;
    responses?: Record<string, unknown>;
  };
};

const loadComponentsFragment = (
  relativePath: string,
): OpenApiComponentsFragment | undefined => {
  const raw = yaml.load(
    fs.readFileSync(path.join(__dirname, relativePath), "utf8"),
    { schema: yaml.CORE_SCHEMA },
  );

  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }

  return raw as OpenApiComponentsFragment;
};

const schemasYaml = loadComponentsFragment("schemas.yml");
const responsesYaml = loadComponentsFragment("responses.yml");

export default {
  schemas: schemasYaml?.components?.schemas ?? {},
  responses: responsesYaml?.components?.responses ?? {},
};
