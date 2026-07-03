import { FeatureDefinition, PermissionEntry, id } from '../types';

// Students have view-all vs view-own (parent sees linked, student sees own).

const view: PermissionEntry = {
  id: id('view-students'),
  feature: 'student',
  kind: 'view',
  label: 'View all students',
  ownership: 'all',
  ownershipFor: 'student',
};

const viewOwn: PermissionEntry = {
  id: id('view-own-students'),
  feature: 'student',
  kind: 'view-own',
  label: 'View own/linked student profiles',
  ownership: 'own',
  ownershipFor: 'student',
};

const create: PermissionEntry = {
  id: id('create-students'),
  feature: 'student',
  kind: 'create',
  label: 'Create student profiles',
};

const edit: PermissionEntry = {
  id: id('edit-students'),
  feature: 'student',
  kind: 'edit',
  label: 'Edit student profiles',
};

const deletePerm: PermissionEntry = {
  id: id('delete-students'),
  feature: 'student',
  kind: 'delete',
  label: 'Delete student profiles',
};

const invite: PermissionEntry = {
  id: id('invite-students'),
  feature: 'student',
  kind: 'create',
  label: 'Invite new students',
};

const all: PermissionEntry = {
  id: id('all-student'),
  feature: 'student',
  kind: 'all',
  label: 'All',
  grants: [view.id, viewOwn.id, create.id, edit.id, deletePerm.id, invite.id],
};

export const studentFeature: FeatureDefinition = {
  key: 'student',
  title: 'Students',
  iconName: 'Users',
  editorCategory: 'People',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [viewOwn.id]: viewOwn,
    [create.id]: create,
    [edit.id]: edit,
    [deletePerm.id]: deletePerm,
    [invite.id]: invite,
  },
};
