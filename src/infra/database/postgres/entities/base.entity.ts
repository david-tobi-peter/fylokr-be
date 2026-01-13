import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
} from "typeorm";

export abstract class BaseEntity {
  @PrimaryColumn("uuid", { default: () => "uuid_generate_v7()" })
  id!: string;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "(NOW() AT TIME ZONE 'UTC')::timestamptz",
    name: "created_at",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
    nullable: true,
    name: "updated_at",
  })
  updatedAt!: Date | null;

  @DeleteDateColumn({
    type: "timestamptz",
    nullable: true,
    name: "deleted_at",
  })
  deletedAt!: Date | null;
}
