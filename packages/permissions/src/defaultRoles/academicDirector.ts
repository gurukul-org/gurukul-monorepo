import { DefaultRoleDefinition } from "../types";
import { PERMS } from "../registry";

// Academic Director — Dean-level academic oversight.
// Full access to all academic modules, read access to people and operations.
export const academicDirector: DefaultRoleDefinition = {
  title: "Academic Director",
  isAdmin: false,
  rank: 3,
  scopes: [
    // Dashboard
    PERMS.dashboard.view.id,
    // Academics — full
    PERMS.academicTerm.all.id,
    PERMS.program.all.id,
    PERMS.course.all.id,
    PERMS.class.all.id,
    PERMS.instructor.all.id,
    // People — view only
    PERMS.student.view.id,
    PERMS.parent.view.id,
    // Operations — view only
    PERMS.enrolment.view.id,
    PERMS.attendance.view.id,
    // Assessment — full
    PERMS.grade.all.id,
    // Library — view
    PERMS.library.view.id,
    // Analytics
    PERMS.report.view.id,
  ],
};
