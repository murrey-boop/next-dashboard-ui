-- CreateEnum
CREATE TYPE "TeacherRole" AS ENUM ('TEACHER', 'SENIOR_TEACHER', 'DEPUTY_HEAD', 'HEADTEACHER');

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "role" "TeacherRole" NOT NULL DEFAULT 'TEACHER';
