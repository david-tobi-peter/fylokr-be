import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity.js";

@Entity("users")
export class UserEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  username!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "simple-array", nullable: true })
  recoveryCodes!: string[] | null;
}
