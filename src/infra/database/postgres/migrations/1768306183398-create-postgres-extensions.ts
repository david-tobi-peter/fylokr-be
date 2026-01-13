import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostgresExtensions1768306183398 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_uuidv7"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "citext"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pg_uuidv7"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
