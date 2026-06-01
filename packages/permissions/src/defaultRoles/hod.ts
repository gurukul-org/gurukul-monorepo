import { DefaultRoleDefinition } from "../types";
import { PERMS } from "../registry";

// HOD — Head of Department.
// Manages courses, classes, and instructors. Views students and enrolments.
// Can mark attendance and manage grades for their department.
export const hod: DefaultRoleDefinition = {
  title: "HOD",
  isAdmin: false,
  rank: 4,
  scopes: [
    // Dashboard
    PERMS.dashboard.view.id,
    // Academics
    PERMS.academicTerm.view.id,
    PERMS.program.view.id,
    PERMS.program.edit.id,
    PERMS.course.all.id,
    PERMS.class.all.id,
    PERMS.instructor.all.id,
    // People — view
    PERMS.student.view.id,
    PERMS.parent.view.id,
    // Operations
    PERMS.enrolment.view.id,
    PERMS.attendance.view.id,
    PERMS.attendance.mark.id,
    PERMS.attendance.edit.id,
    // Assessment
    PERMS.grade.view.id,
    PERMS.grade.enter.id,
    PERMS.grade.edit.id,
    // Library — view
    PERMS.library.view.id,
  ],
};
