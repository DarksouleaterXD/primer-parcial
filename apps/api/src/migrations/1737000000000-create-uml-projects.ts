import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUmlProjects1737000000000 implements MigrationInterface {
  name = "CreateUmlProjects1737000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "uml_projects" (
        "id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "revision" integer NOT NULL DEFAULT 0,
        "document" jsonb NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_uml_projects_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_uml_projects_revision_non_negative" CHECK ("revision" >= 0),
        CONSTRAINT "FK_uml_projects_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_uml_projects_owner_updated_id"
      ON "uml_projects" ("owner_id", "updated_at" DESC, "id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "uml_projects"');
  }
}