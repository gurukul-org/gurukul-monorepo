import { FEATURES } from '../registry';
import { DefaultRoleDefinition } from '../types';

// Owner = every permission in the registry.
// Programmatically computed so adding a permission can't leave Owner without it.
export const owner: DefaultRoleDefinition = {
  title: 'Owner',
  isAdmin: true,
  rank: 1,
  scopes: Object.values(FEATURES).flatMap((f) =>
    Object.values(f.permissions).map((p) => p.id),
  ),
};
