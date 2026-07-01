import { FeatureDefinition, PermissionEntry, id } from '../types';

const view: PermissionEntry = {
  id: id('view-users'),
  feature: 'user',
  kind: 'view',
  label: 'View all users',
};

const invite: PermissionEntry = {
  id: id('invite-users'),
  feature: 'user',
  kind: 'create',
  label: 'Invite new users',
};

const edit: PermissionEntry = {
  id: id('edit-users'),
  feature: 'user',
  kind: 'edit',
  label: 'Edit user accounts',
};

const deletePerm: PermissionEntry = {
  id: id('delete-users'),
  feature: 'user',
  kind: 'delete',
  label: 'Deactivate or remove users',
};

const suspend: PermissionEntry = {
  id: id('suspend-users'),
  feature: 'user',
  kind: 'custom',
  label: 'Suspend or reactivate users',
};

const all: PermissionEntry = {
  id: id('all-user'),
  feature: 'user',
  kind: 'all',
  label: 'All',
  grants: [view.id, invite.id, edit.id, deletePerm.id, suspend.id],
};

export const userFeature: FeatureDefinition = {
  key: 'user',
  title: 'Users',
  iconName: 'UserCog',
  editorCategory: 'Admin',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [invite.id]: invite,
    [edit.id]: edit,
    [deletePerm.id]: deletePerm,
    [suspend.id]: suspend,
  },
};
