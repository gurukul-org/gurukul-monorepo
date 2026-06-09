import { PERMS } from '../registry';
import { DefaultRoleDefinition } from '../types';

// Branch Manager — manages a specific campus/branch.
// Full access to academics, people, operations, and analytics within their branch.
// Cannot manage roles or institution-wide settings.
export const branchManager: DefaultRoleDefinition = {
  title: 'Branch Manager',
  isAdmin: false,
  rank: 2,
  scopes: [
    // Dashboard
    PERMS.dashboard.all.id,
    // Academics
    PERMS.academicTerm.all.id,
    PERMS.program.all.id,
    PERMS.course.all.id,
    PERMS.class.all.id,
    PERMS.instructor.all.id,
    // People
    PERMS.student.all.id,
    PERMS.parent.all.id,
    PERMS.user.view.id,
    PERMS.user.invite.id,
    PERMS.user.edit.id,
    // Operations
    PERMS.enrolment.all.id,
    PERMS.fee.all.id,
    PERMS.attendance.all.id,
    PERMS.library.all.id,
    // Assessment
    PERMS.grade.all.id,
    // Analytics
    PERMS.report.view.id,
    // Admin
    PERMS.role.view.id,
    PERMS.tenant.view.id,
  ],
};
