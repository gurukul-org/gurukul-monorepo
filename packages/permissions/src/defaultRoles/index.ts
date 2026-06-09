import { academicDirector } from './academicDirector';
import { administrativeOfficer } from './administrativeOfficer';
import { branchManager } from './branchManager';
import { faculty } from './faculty';
import { hod } from './hod';
import { owner } from './owner';
import { parentRole } from './parent';
import { staff } from './staff';
import { studentRole } from './student';

export {
  owner,
  branchManager,
  academicDirector,
  hod,
  administrativeOfficer,
  faculty,
  staff,
  studentRole,
  parentRole,
};

// Aggregated array for seed code that loops over them.
// Ordered by rank (highest privilege first).
export const DEFAULT_ROLES = [
  owner,
  branchManager,
  academicDirector,
  hod,
  administrativeOfficer,
  faculty,
  staff,
  studentRole,
  parentRole,
] as const;
