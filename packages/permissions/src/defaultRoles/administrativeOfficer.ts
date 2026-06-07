import { DefaultRoleDefinition } from "../types";
import { PERMS } from "../registry";

// Administrative Officer — merged Registrar + Accountant role.
// Handles admissions, enrolments, fees, and student/parent management.
export const administrativeOfficer: DefaultRoleDefinition = {
  title: "Administrative Officer",
  isAdmin: false,
  rank: 5,
  scopes: [
    // Dashboard
    PERMS.dashboard.view.id,
    // Academics — view only
    PERMS.academicTerm.view.id,
    PERMS.program.view.id,
    PERMS.course.view.id,
    PERMS.class.view.id,
    PERMS.instructor.view.id,
    // People — full student and parent management
    PERMS.student.all.id,
    PERMS.parent.all.id,
    // Operations — full enrolment and fee management
    PERMS.enrolment.all.id,
    PERMS.fee.all.id,
    // Library — full
    PERMS.library.all.id,
    // Analytics
    PERMS.report.view.id,
  ],
};
