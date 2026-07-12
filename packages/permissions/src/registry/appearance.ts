import { FeatureDefinition, PermissionEntry, id } from '../types';

const view: PermissionEntry = {
  id: id('view-appearance'),
  feature: 'appearance',
  kind: 'view',
  label: 'View appearance',
};

const edit: PermissionEntry = {
  id: id('edit-appearance'),
  feature: 'appearance',
  kind: 'edit',
  label: 'Edit appearance',
};

const all: PermissionEntry = {
  id: id('all-appearance'),
  feature: 'appearance',
  kind: 'all',
  label: 'All',
  grants: [view.id, edit.id],
};

export const appearanceFeature: FeatureDefinition = {
  key: 'appearance',
  title: 'Appearance',
  iconName: 'Settings',
  editorCategory: 'Admin',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [edit.id]: edit,
  },
};
