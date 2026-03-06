import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddIs2faEnabledToUsersTable1769288578646 implements MigrationInterface {
  private readonly tableName = "users";
  private readonly columnName = "is_2fa_enabled";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE ${this.tableName}
        ADD COLUMN ${this.columnName} BOOLEAN DEFAULT FALSE;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE ${this.tableName}
        DROP COLUMN ${this.columnName};
      `);
  }
}
