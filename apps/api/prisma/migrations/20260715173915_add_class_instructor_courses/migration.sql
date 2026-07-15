-- CreateTable
CREATE TABLE "class_instructor_courses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "class_instructor_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "assigned_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "class_instructor_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_instructor_courses_class_instructor_id_course_id_key" ON "class_instructor_courses"("class_instructor_id", "course_id");

-- AddForeignKey
ALTER TABLE "class_instructor_courses" ADD CONSTRAINT "class_instructor_courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instructor_courses" ADD CONSTRAINT "class_instructor_courses_class_instructor_id_fkey" FOREIGN KEY ("class_instructor_id") REFERENCES "class_instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instructor_courses" ADD CONSTRAINT "class_instructor_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instructor_courses" ADD CONSTRAINT "class_instructor_courses_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
