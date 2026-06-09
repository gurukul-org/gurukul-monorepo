import { FeatureDefinition, PermissionEntry, id } from '../types';

// Future feature — defining now so permissions are ready when the module is built.

const view: PermissionEntry = {
  id: id('view-grades'),
  feature: 'grade',
  kind: 'view',
  label: 'View all grades',
  ownership: 'all',
  ownershipFor: 'grade',
};

const viewOwn: PermissionEntry = {
  id: id('view-own-grades'),
  feature: 'grade',
  kind: 'view-own',
  label: 'View own grades',
  ownership: 'own',
  ownershipFor: 'grade',
};

const enter: PermissionEntry = {
  id: id('enter-grades'),
  feature: 'grade',
  kind: 'create',
  label: 'Enter marks and grades',
};

const edit: PermissionEntry = {
  id: id('edit-grades'),
  feature: 'grade',
  kind: 'edit',
  label: 'Edit marks and grades',
};

const all: PermissionEntry = {
  id: id('all-grade'),
  feature: 'grade',
  kind: 'all',
  label: 'All',
  grants: [view.id, viewOwn.id, enter.id, edit.id],
};

export const gradeFeature: FeatureDefinition = {
  key: 'grade',
  title: 'Grades',
  iconName: 'Award',
  editorCategory: 'Assessment',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [viewOwn.id]: viewOwn,
    [enter.id]: enter,
    [edit.id]: edit,
  },
};
