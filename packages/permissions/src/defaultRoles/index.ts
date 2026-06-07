import { owner } from "./owner";
import { branchManager } from "./branchManager";
import { academicDirector } from "./academicDirector";
import { hod } from "./hod";
import { administrativeOfficer } from "./administrativeOfficer";
import { faculty } from "./faculty";
import { staff } from "./staff";
import { studentRole } from "./student";
import { parentRole } from "./parent";

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
