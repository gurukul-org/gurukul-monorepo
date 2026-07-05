-- DropIndex
DROP INDEX "enrolments_student_profile_id_class_id_key";

-- AlterTable
ALTER TABLE "enrolments" ADD COLUMN     "withdraw_reason" VARCHAR(255);

-- CreateIndex
CREATE INDEX "enrolments_student_profile_id_class_id_status_idx" ON "enrolments"("student_profile_id", "class_id", "status");
