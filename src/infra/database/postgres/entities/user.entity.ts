import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity.js";

@Entity("users")
export class UserEntity extends BaseEntity {
  @Column({ type: "citext", unique: true, nullable: false })
  username!: string;

  @Column({ type: "bytea", nullable: false, name: "hashed_password" })
  hashedPassword!: string;

  @Column({
    type: "boolean",
    default: true,
    nullable: false,
    name: "is_active",
  })
  isActive!: boolean;

  @Column({ type: "citext", unique: true, nullable: false })
  email!: string;

  @Column({
    type: "simple-array",
    nullable: true,
    name: "hashed_recovery_codes",
  })
  hashedRecoveryCodes!: string[] | null;
}
