import { FeatureDefinition, PermissionEntry, id } from '../types';

// Classes have view-all vs view-own (faculty sees assigned, students see enrolled).

const view: PermissionEntry = {
  id: id('view-classes'),
  feature: 'class',
  kind: 'view',
  label: 'View all classes',
  ownership: 'all',
  ownershipFor: 'class',
};

const viewOwn: PermissionEntry = {
  id: id('view-own-classes'),
  feature: 'class',
  kind: 'view-own',
  label: 'View assigned/enrolled classes',
  ownership: 'own',
  ownershipFor: 'class',
};

const create: PermissionEntry = {
  id: id('create-classes'),
  feature: 'class',
  kind: 'create',
  label: 'Create classes',
};

const edit: PermissionEntry = {
  id: id('edit-classes'),
  feature: 'class',
  kind: 'edit',
  label: 'Edit classes',
};

const deletePerm: PermissionEntry = {
  id: id('delete-classes'),
  feature: 'class',
  kind: 'delete',
  label: 'Delete classes',
};

const all: PermissionEntry = {
  id: id('all-class'),
  feature: 'class',
  kind: 'all',
  label: 'All',
  grants: [view.id, viewOwn.id, create.id, edit.id, deletePerm.id],
};

export const classFeature: FeatureDefinition = {
  key: 'class',
  title: 'Classes',
  iconName: 'School',
  editorCategory: 'Academics',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [viewOwn.id]: viewOwn,
    [create.id]: create,
    [edit.id]: edit,
    [deletePerm.id]: deletePerm,
  },
};
