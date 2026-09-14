import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserNames1736900000000 implements MigrationInterface {
  name = "AddUserNames1736900000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "first_name" varchar');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "last_name" varchar');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "last_name"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "first_name"');
  }
}
