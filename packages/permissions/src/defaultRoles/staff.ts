import { DefaultRoleDefinition } from "../types";
import { PERMS } from "../registry";

// Staff — non-teaching staff (clerks, lab assistants, librarians, etc.)
// Mostly view-only access to key modules.
export const staff: DefaultRoleDefinition = {
  title: "Staff",
  isAdmin: false,
  rank: 7,
  scopes: [
    // Dashboard — own
    PERMS.dashboard.viewOwn.id,
    // Academics — view only
    PERMS.class.view.id,
    // People — view only
    PERMS.student.view.id,
    // Operations
    PERMS.attendance.view.id,
    // Library — view
    PERMS.library.view.id,
  ],
};
