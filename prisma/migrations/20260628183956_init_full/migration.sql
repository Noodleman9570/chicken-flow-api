-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'superadmin';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "allowed_routes" JSONB;
