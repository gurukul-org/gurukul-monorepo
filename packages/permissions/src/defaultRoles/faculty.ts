import { PERMS } from '../registry';
import { DefaultRoleDefinition } from '../types';

// Faculty / Instructor — teaching staff.
// Views own classes, marks attendance, enters grades for assigned classes.
export const faculty: DefaultRoleDefinition = {
  title: 'Faculty',
  isAdmin: false,
  rank: 6,
  scopes: [
    // Dashboard — own
    PERMS.dashboard.viewOwn.id,
    // Academics — view own assigned
    PERMS.course.viewOwn.id,
    PERMS.class.viewOwn.id,
    // People — view students in own classes
    PERMS.student.view.id,
    PERMS.parent.view.id,
    // Operations — attendance for own classes
    PERMS.attendance.view.id,
    PERMS.attendance.mark.id,
    PERMS.attendance.edit.id,
    // Assessment — grades for own classes
    PERMS.grade.view.id,
    PERMS.grade.enter.id,
    PERMS.grade.edit.id,
    // Library — view
    PERMS.library.view.id,
  ],
};
