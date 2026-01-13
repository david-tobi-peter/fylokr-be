import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1768306902438 implements MigrationInterface {
  private tableName: string = "users";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE ${this.tableName} (
                id uuid NOT NULL DEFAULT uuid_generate_v7(),
                username citext NOT NULL,
                email citext NOT NULL,
                hashed_password bytea NOT NULL,
                hashed_recovery_codes text[],
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')::timestamptz,
                updated_at TIMESTAMP WITH TIME ZONE,
                deleted_at TIMESTAMP WITH TIME ZONE,
                
                CONSTRAINT "uq_${this.tableName}_username" UNIQUE ("username"),
                CONSTRAINT "pk_${this.tableName}_id" PRIMARY KEY ("id"),
                CONSTRAINT uq_${this.tableName}_email UNIQUE (email)
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ${this.tableName}`);
  }
}
