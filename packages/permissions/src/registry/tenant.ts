import { FeatureDefinition, PermissionEntry, id } from '../types';

const view: PermissionEntry = {
  id: id('view-tenant-settings'),
  feature: 'tenant',
  kind: 'view',
  label: 'View institution settings',
};

const edit: PermissionEntry = {
  id: id('edit-tenant-settings'),
  feature: 'tenant',
  kind: 'edit',
  label: 'Edit institution settings',
};

const all: PermissionEntry = {
  id: id('all-tenant'),
  feature: 'tenant',
  kind: 'all',
  label: 'All',
  grants: [view.id, edit.id],
};

export const tenantFeature: FeatureDefinition = {
  key: 'tenant',
  title: 'Institution Settings',
  iconName: 'Settings',
  editorCategory: 'Admin',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [edit.id]: edit,
  },
};
