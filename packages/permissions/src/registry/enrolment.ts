import { FeatureDefinition, PermissionEntry, id } from '../types';

const view: PermissionEntry = {
  id: id('view-enrolments'),
  feature: 'enrolment',
  kind: 'view',
  label: 'View all enrolments',
  ownership: 'all',
  ownershipFor: 'enrolment',
};

const viewOwn: PermissionEntry = {
  id: id('view-own-enrolments'),
  feature: 'enrolment',
  kind: 'view-own',
  label: 'View own enrolments',
  ownership: 'own',
  ownershipFor: 'enrolment',
};

const create: PermissionEntry = {
  id: id('create-enrolments'),
  feature: 'enrolment',
  kind: 'create',
  label: 'Enrol students in classes',
};

const edit: PermissionEntry = {
  id: id('edit-enrolments'),
  feature: 'enrolment',
  kind: 'edit',
  label: 'Edit enrolment status',
};

const deletePerm: PermissionEntry = {
  id: id('delete-enrolments'),
  feature: 'enrolment',
  kind: 'delete',
  label: 'Remove enrolments',
};

const all: PermissionEntry = {
  id: id('all-enrolment'),
  feature: 'enrolment',
  kind: 'all',
  label: 'All',
  grants: [view.id, viewOwn.id, create.id, edit.id, deletePerm.id],
};

export const enrolmentFeature: FeatureDefinition = {
  key: 'enrolment',
  title: 'Enrolments',
  iconName: 'ClipboardList',
  editorCategory: 'Operations',
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
