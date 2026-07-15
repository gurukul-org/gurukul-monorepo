import { accountOwner } from './accountOwner';
import { classIncharge } from './classIncharge';
import { coordinators } from './coordinators';
import { hod } from './hod';
import { parentsRole } from './parents';
import { principal } from './principal';
import { studentRole } from './student';
import { teacher } from './teacher';

export {
  accountOwner,
  principal,
  coordinators,
  hod,
  classIncharge,
  teacher,
  studentRole,
  parentsRole,
};

// Aggregated array for seed code that loops over them.
// Ordered by rank (highest privilege first).
export const DEFAULT_ROLES = [
  accountOwner,
  principal,
  coordinators,
  hod,
  classIncharge,
  teacher,
  studentRole,
  parentsRole,
] as const;
