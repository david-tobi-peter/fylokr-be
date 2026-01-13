import { execSync } from "child_process";
import path from "path";

const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Please provide a migration name.");
  process.exit(1);
}

const dataSourcePath =
  "src/infra/database/postgres/config/datasource.config.ts";
const migrationsDir = "src/infra/database/postgres/migrations";
const typeormCli = "./node_modules/typeorm/cli.js";

const command = `npx tsx ${typeormCli} migration:generate -d ${dataSourcePath} ${path.join(migrationsDir, migrationName)}`;

try {
  console.log(`Generating migration: ${migrationName}...`);
  execSync(command, { stdio: "inherit" });
} catch (error) {
  console.error(`Failed to generate migration: ${error}`);
  process.exit(1);
}
