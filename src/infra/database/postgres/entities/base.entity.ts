import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  BeforeInsert,
} from "typeorm";
import { uuidv7 } from "uuidv7";

export abstract class BaseEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @BeforeInsert()
  protected generateId(): void {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

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
