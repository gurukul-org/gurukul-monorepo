import { FeatureDefinition, PermissionEntry, id } from '../types';

const view: PermissionEntry = {
  id: id('view-academic-terms'),
  feature: 'academicTerm',
  kind: 'view',
  label: 'View academic terms',
};

const create: PermissionEntry = {
  id: id('create-academic-terms'),
  feature: 'academicTerm',
  kind: 'create',
  label: 'Create academic terms',
};

const edit: PermissionEntry = {
  id: id('edit-academic-terms'),
  feature: 'academicTerm',
  kind: 'edit',
  label: 'Edit academic terms',
};

const deletePerm: PermissionEntry = {
  id: id('delete-academic-terms'),
  feature: 'academicTerm',
  kind: 'delete',
  label: 'Delete academic terms',
};

const all: PermissionEntry = {
  id: id('all-academic-term'),
  feature: 'academicTerm',
  kind: 'all',
  label: 'All',
  grants: [view.id, create.id, edit.id, deletePerm.id],
};

export const academicTermFeature: FeatureDefinition = {
  key: 'academicTerm',
  title: 'Academic Terms',
  iconName: 'Calendar',
  editorCategory: 'Academics',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [create.id]: create,
    [edit.id]: edit,
    [deletePerm.id]: deletePerm,
  },
};
