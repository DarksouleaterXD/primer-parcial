import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "first_name", type: "varchar", nullable: true })
  firstName!: string | null;

  @Column({ name: "last_name", type: "varchar", nullable: true })
  lastName!: string | null;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", select: false })
  passwordHash!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
