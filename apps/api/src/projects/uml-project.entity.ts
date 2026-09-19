import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "uml_projects" })
export class UmlProjectEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "owner_id", type: "uuid" })
  ownerId!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "integer" })
  revision!: number;

  // JSONB is deliberately untrusted here. Every read crosses the canonical
  // ProjectDocument parser before the value leaves the storage adapter.
  @Column({ type: "jsonb" })
  document!: object;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}