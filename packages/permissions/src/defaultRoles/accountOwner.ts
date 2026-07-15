import { FEATURES } from '../registry';
import { DefaultRoleDefinition } from '../types';

// Account Owner — top-level school owner.
// Grants every permission in the registry and full administrative rights.
export const accountOwner: DefaultRoleDefinition = {
  title: 'Account Owner',
  isAdmin: true,
  rank: 1,
  scopes: Object.values(FEATURES).flatMap((f) =>
    Object.values(f.permissions).map((p) => p.id),
  ),
};
