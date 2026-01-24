import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActiveToUsersTable1769262407442 implements MigrationInterface {
  private readonly tableName = "users";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "${this.tableName}" ADD "isActive" boolean NOT NULL DEFAULT true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "${this.tableName}" DROP COLUMN "isActive";
    `);
  }
}
