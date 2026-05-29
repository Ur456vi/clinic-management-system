-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PATIENT';

-- AlterTable
ALTER TABLE "assessment_submissions" ALTER COLUMN "id" DROP DEFAULT;
