import { execSync } from "child_process";
import path from "path";

const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Please provide a migration name.");
  process.exit(1);
}

const migrationsDir = "src/infra/database/postgres/migrations";
const typeormCli = "./node_modules/typeorm/cli.js";

const command = `npx tsx ${typeormCli} migration:create ${path.join(migrationsDir, migrationName)}`;

try {
  console.log(`Creating migration file: ${migrationName}...`);
  execSync(command, { stdio: "inherit" });
} catch (error) {
  console.error(`Failed to create migration file: ${error}`);
  process.exit(1);
}
