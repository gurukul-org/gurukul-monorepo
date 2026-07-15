import { FEATURES } from '../registry';
import { DefaultRoleDefinition } from '../types';

// Principal — school administrator.
// Grants every permission in the registry.
export const principal: DefaultRoleDefinition = {
  title: 'Principal',
  isAdmin: true,
  rank: 2,
  scopes: Object.values(FEATURES).flatMap((f) =>
    Object.values(f.permissions).map((p) => p.id),
  ),
};
