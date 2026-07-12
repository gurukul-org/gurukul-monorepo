import { FEATURES, PERMS } from '../registry';
import { EditorCategory, FeatureDefinition, PermissionId } from '../types';

// Group features by the bucket the role editor renders them into.
export function featuresByEditorCategory(): Readonly<
  Record<EditorCategory, FeatureDefinition[]>
> {
  const out: Record<EditorCategory, FeatureDefinition[]> = {
    Academics: [],
    People: [],
    Operations: [],
    Assessment: [],
    Admin: [],
    Analytics: [],
  };
  for (const feature of Object.values(FEATURES)) {
    out[feature.editorCategory].push(feature);
  }
  return out;
}

// Permission dependency rules for the role editor.
// `implies` — these ids are auto-added when the rule's id is selected.
// `impliesOneOf` — at least one of these ids must be present; if none is, add the first.
export interface PermissionDependency {
  readonly id: PermissionId;
  readonly implies?: readonly PermissionId[];
  readonly impliesOneOf?: readonly PermissionId[];
}

export const DEPENDENCIES: readonly PermissionDependency[] = [
  // Academic term CRUD implies view.
  { id: PERMS.academicTerm.create.id, implies: [PERMS.academicTerm.view.id] },
  { id: PERMS.academicTerm.edit.id, implies: [PERMS.academicTerm.view.id] },
  { id: PERMS.academicTerm.delete.id, implies: [PERMS.academicTerm.view.id] },
  // Program CRUD implies view.
  { id: PERMS.program.create.id, implies: [PERMS.program.view.id] },
  { id: PERMS.program.edit.id, implies: [PERMS.program.view.id] },
  { id: PERMS.program.delete.id, implies: [PERMS.program.view.id] },
  // Course CRUD implies viewing courses (all or own).
  {
    id: PERMS.course.create.id,
    impliesOneOf: [PERMS.course.view.id, PERMS.course.viewOwn.id],
  },
  {
    id: PERMS.course.edit.id,
    impliesOneOf: [PERMS.course.view.id, PERMS.course.viewOwn.id],
  },
  {
    id: PERMS.course.delete.id,
    impliesOneOf: [PERMS.course.view.id, PERMS.course.viewOwn.id],
  },
  // Class CRUD implies viewing classes (all or own).
  {
    id: PERMS.class.create.id,
    impliesOneOf: [PERMS.class.view.id, PERMS.class.viewOwn.id],
  },
  {
    id: PERMS.class.edit.id,
    impliesOneOf: [PERMS.class.view.id, PERMS.class.viewOwn.id],
  },
  {
    id: PERMS.class.delete.id,
    impliesOneOf: [PERMS.class.view.id, PERMS.class.viewOwn.id],
  },
  // Instructor management implies view.
  { id: PERMS.instructor.assign.id, implies: [PERMS.instructor.view.id] },
  { id: PERMS.instructor.edit.id, implies: [PERMS.instructor.view.id] },
  { id: PERMS.instructor.remove.id, implies: [PERMS.instructor.view.id] },
  // Student CRUD implies viewing students (all or own).
  {
    id: PERMS.student.create.id,
    impliesOneOf: [PERMS.student.view.id, PERMS.student.viewOwn.id],
  },
  {
    id: PERMS.student.edit.id,
    impliesOneOf: [PERMS.student.view.id, PERMS.student.viewOwn.id],
  },
  {
    id: PERMS.student.delete.id,
    impliesOneOf: [PERMS.student.view.id, PERMS.student.viewOwn.id],
  },
  // Parent CRUD implies viewing parents (all or own).
  {
    id: PERMS.parent.create.id,
    impliesOneOf: [PERMS.parent.view.id, PERMS.parent.viewOwn.id],
  },
  {
    id: PERMS.parent.edit.id,
    impliesOneOf: [PERMS.parent.view.id, PERMS.parent.viewOwn.id],
  },
  {
    id: PERMS.parent.delete.id,
    impliesOneOf: [PERMS.parent.view.id, PERMS.parent.viewOwn.id],
  },
  // Enrolment CRUD implies viewing enrolments (all or own).
  {
    id: PERMS.enrolment.create.id,
    impliesOneOf: [PERMS.enrolment.view.id, PERMS.enrolment.viewOwn.id],
  },
  {
    id: PERMS.enrolment.edit.id,
    impliesOneOf: [PERMS.enrolment.view.id, PERMS.enrolment.viewOwn.id],
  },
  {
    id: PERMS.enrolment.delete.id,
    impliesOneOf: [PERMS.enrolment.view.id, PERMS.enrolment.viewOwn.id],
  },
  // Fee CRUD implies viewing fees (all or own).
  {
    id: PERMS.fee.create.id,
    impliesOneOf: [PERMS.fee.view.id, PERMS.fee.viewOwn.id],
  },
  {
    id: PERMS.fee.edit.id,
    impliesOneOf: [PERMS.fee.view.id, PERMS.fee.viewOwn.id],
  },
  {
    id: PERMS.fee.delete.id,
    impliesOneOf: [PERMS.fee.view.id, PERMS.fee.viewOwn.id],
  },
  // Attendance mark/edit implies viewing attendance.
  {
    id: PERMS.attendance.mark.id,
    impliesOneOf: [PERMS.attendance.view.id, PERMS.attendance.viewOwn.id],
  },
  {
    id: PERMS.attendance.edit.id,
    impliesOneOf: [PERMS.attendance.view.id, PERMS.attendance.viewOwn.id],
  },
  // Grade enter/edit implies viewing grades.
  {
    id: PERMS.grade.enter.id,
    impliesOneOf: [PERMS.grade.view.id, PERMS.grade.viewOwn.id],
  },
  {
    id: PERMS.grade.edit.id,
    impliesOneOf: [PERMS.grade.view.id, PERMS.grade.viewOwn.id],
  },
  // Library CRUD implies view.
  { id: PERMS.library.create.id, implies: [PERMS.library.view.id] },
  { id: PERMS.library.edit.id, implies: [PERMS.library.view.id] },
  { id: PERMS.library.delete.id, implies: [PERMS.library.view.id] },
  // User CRUD implies view.
  { id: PERMS.user.invite.id, implies: [PERMS.user.view.id] },
  { id: PERMS.user.edit.id, implies: [PERMS.user.view.id] },
  { id: PERMS.user.delete.id, implies: [PERMS.user.view.id] },
  // Role CRUD implies view.
  { id: PERMS.role.create.id, implies: [PERMS.role.view.id] },
  { id: PERMS.role.edit.id, implies: [PERMS.role.view.id] },
  { id: PERMS.role.delete.id, implies: [PERMS.role.view.id] },
  // Tenant edit implies view.
  { id: PERMS.tenant.edit.id, implies: [PERMS.tenant.view.id] },
  // Appearance edit implies view.
  { id: PERMS.appearance.edit.id, implies: [PERMS.appearance.view.id] },
];

// Apply dependency cascade for a single permission being added.
// Mutates the passed Set so callers can chain.
export function applyDependencies(
  newlyAdded: PermissionId,
  scopes: Set<string>,
): void {
  const rule = DEPENDENCIES.find((d) => d.id === newlyAdded);
  if (!rule) return;
  rule.implies?.forEach((p) => scopes.add(p));
  if (
    rule.impliesOneOf &&
    !rule.impliesOneOf.some((p) => scopes.has(p as string))
  ) {
    scopes.add(rule.impliesOneOf[0] as string);
  }
}
