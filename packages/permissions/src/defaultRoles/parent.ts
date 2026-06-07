import { DefaultRoleDefinition } from "../types";
import { PERMS } from "../registry";

// Parent / Guardian — can view linked student's data and communicate with teachers.
export const parentRole: DefaultRoleDefinition = {
  title: "Parent",
  isAdmin: false,
  rank: 9,
  scopes: [
    // Dashboard — own
    PERMS.dashboard.viewOwn.id,
    // People — view own profile + linked students
    PERMS.parent.viewOwn.id,
    PERMS.student.viewOwn.id,
    // Operations — view own linked
    PERMS.fee.viewOwn.id,
    PERMS.attendance.viewOwn.id,
    // Assessment — view own linked
    PERMS.grade.viewOwn.id,
  ],
};
