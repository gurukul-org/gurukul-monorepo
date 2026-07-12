import { FeatureDefinition, FeatureKey, PermissionId } from '../types';
import { academicTermFeature } from './academicTerm';
import { appearanceFeature } from './appearance';
import { attendanceFeature } from './attendance';
import { classFeature } from './class';
import { courseFeature } from './course';
import { dashboardFeature } from './dashboard';
import { enrolmentFeature } from './enrolment';
import { feeFeature } from './fee';
import { gradeFeature } from './grade';
import { instructorFeature } from './instructor';
import { libraryFeature } from './library';
import { parentFeature } from './parent';
import { programFeature } from './program';
import { reportFeature } from './report';
import { roleFeature } from './role';
import { studentFeature } from './student';
import { tenantFeature } from './tenant';
import { userFeature } from './user';

// FEATURES — the source of truth that helpers iterate over.
export const FEATURES: Readonly<Record<FeatureKey, FeatureDefinition>> = {
  dashboard: dashboardFeature,
  academicTerm: academicTermFeature,
  program: programFeature,
  course: courseFeature,
  class: classFeature,
  instructor: instructorFeature,
  student: studentFeature,
  parent: parentFeature,
  enrolment: enrolmentFeature,
  fee: feeFeature,
  attendance: attendanceFeature,
  grade: gradeFeature,
  library: libraryFeature,
  user: userFeature,
  role: roleFeature,
  tenant: tenantFeature,
  appearance: appearanceFeature,
  report: reportFeature,
};

// Lookup helper used only by the PERMS facade below.
// Throws at module load if a feature is missing an expected permission id — drift is loud.
function p(feature: FeatureKey, permissionId: string) {
  const entry = FEATURES[feature].permissions[permissionId as PermissionId];
  if (!entry) {
    throw new Error(
      `Permission '${permissionId}' not found on feature '${feature}'. ` +
        `Update the feature file or the PERMS facade.`,
    );
  }
  return entry;
}

// PERMS — the typed, autocomplete-friendly accessor used throughout BE/FE.
export const PERMS = {
  dashboard: {
    all: FEATURES.dashboard.all,
    view: p('dashboard', 'view-dashboard'),
    viewOwn: p('dashboard', 'view-own-dashboard'),
  },
  academicTerm: {
    all: FEATURES.academicTerm.all,
    view: p('academicTerm', 'view-academic-terms'),
    create: p('academicTerm', 'create-academic-terms'),
    edit: p('academicTerm', 'edit-academic-terms'),
    delete: p('academicTerm', 'delete-academic-terms'),
  },
  program: {
    all: FEATURES.program.all,
    view: p('program', 'view-programs'),
    create: p('program', 'create-programs'),
    edit: p('program', 'edit-programs'),
    delete: p('program', 'delete-programs'),
  },
  course: {
    all: FEATURES.course.all,
    view: p('course', 'view-courses'),
    viewOwn: p('course', 'view-own-courses'),
    create: p('course', 'create-courses'),
    edit: p('course', 'edit-courses'),
    delete: p('course', 'delete-courses'),
  },
  class: {
    all: FEATURES.class.all,
    view: p('class', 'view-classes'),
    viewOwn: p('class', 'view-own-classes'),
    create: p('class', 'create-classes'),
    edit: p('class', 'edit-classes'),
    delete: p('class', 'delete-classes'),
  },
  instructor: {
    all: FEATURES.instructor.all,
    view: p('instructor', 'view-instructors'),
    assign: p('instructor', 'assign-instructors'),
    edit: p('instructor', 'edit-instructors'),
    remove: p('instructor', 'remove-instructors'),
  },
  student: {
    all: FEATURES.student.all,
    view: p('student', 'view-students'),
    viewOwn: p('student', 'view-own-students'),
    create: p('student', 'create-students'),
    edit: p('student', 'edit-students'),
    delete: p('student', 'delete-students'),
    invite: p('student', 'invite-students'),
    linkParent: p('student', 'link-parents'),
    editParentLink: p('student', 'edit-parent-links'),
    unlinkParent: p('student', 'unlink-parents'),
  },
  parent: {
    all: FEATURES.parent.all,
    view: p('parent', 'view-parents'),
    viewOwn: p('parent', 'view-own-parent'),
    create: p('parent', 'create-parents'),
    edit: p('parent', 'edit-parents'),
    delete: p('parent', 'delete-parents'),
    invite: p('parent', 'invite-parents'),
  },
  enrolment: {
    all: FEATURES.enrolment.all,
    view: p('enrolment', 'view-enrolments'),
    viewOwn: p('enrolment', 'view-own-enrolments'),
    create: p('enrolment', 'create-enrolments'),
    edit: p('enrolment', 'edit-enrolments'),
    delete: p('enrolment', 'delete-enrolments'),
  },
  fee: {
    all: FEATURES.fee.all,
    view: p('fee', 'view-fees'),
    viewOwn: p('fee', 'view-own-fees'),
    create: p('fee', 'create-fees'),
    edit: p('fee', 'edit-fees'),
    delete: p('fee', 'delete-fees'),
  },
  attendance: {
    all: FEATURES.attendance.all,
    view: p('attendance', 'view-attendance'),
    viewOwn: p('attendance', 'view-own-attendance'),
    mark: p('attendance', 'mark-attendance'),
    edit: p('attendance', 'edit-attendance'),
  },
  grade: {
    all: FEATURES.grade.all,
    view: p('grade', 'view-grades'),
    viewOwn: p('grade', 'view-own-grades'),
    enter: p('grade', 'enter-grades'),
    edit: p('grade', 'edit-grades'),
  },
  library: {
    all: FEATURES.library.all,
    view: p('library', 'view-library'),
    create: p('library', 'create-library'),
    edit: p('library', 'edit-library'),
    delete: p('library', 'delete-library'),
  },
  user: {
    all: FEATURES.user.all,
    view: p('user', 'view-users'),
    invite: p('user', 'invite-users'),
    edit: p('user', 'edit-users'),
    delete: p('user', 'delete-users'),
    suspend: p('user', 'suspend-users'),
  },
  role: {
    all: FEATURES.role.all,
    view: p('role', 'view-roles'),
    create: p('role', 'create-roles'),
    edit: p('role', 'edit-roles'),
    delete: p('role', 'delete-roles'),
  },
  tenant: {
    all: FEATURES.tenant.all,
    view: p('tenant', 'view-tenant-settings'),
    edit: p('tenant', 'edit-tenant-settings'),
  },
  appearance: {
    all: FEATURES.appearance.all,
    view: p('appearance', 'view-appearance'),
    edit: p('appearance', 'edit-appearance'),
  },
  report: {
    all: FEATURES.report.all,
    view: p('report', 'view-reports'),
  },
} as const;

export type Perms = typeof PERMS;
