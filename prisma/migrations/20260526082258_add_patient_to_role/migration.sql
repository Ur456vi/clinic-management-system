-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PATIENT';

-- AlterTable
ALTER TABLE "assessment_submissions" ALTER COLUMN "id" DROP DEFAULT;
