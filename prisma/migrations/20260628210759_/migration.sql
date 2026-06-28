/*
  Warnings:

  - The values [cerrado] on the enum `LotStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LotStatus_new" AS ENUM ('programado', 'activo', 'en_revision', 'finalizado', 'cancelado');
ALTER TABLE "lots" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "lots" ALTER COLUMN "status" TYPE "LotStatus_new" USING ("status"::text::"LotStatus_new");
ALTER TYPE "LotStatus" RENAME TO "LotStatus_old";
ALTER TYPE "LotStatus_new" RENAME TO "LotStatus";
DROP TYPE "LotStatus_old";
ALTER TABLE "lots" ALTER COLUMN "status" SET DEFAULT 'programado';
COMMIT;
