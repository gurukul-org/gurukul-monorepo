import { FeatureDefinition, PermissionEntry, id } from '../types';

const view: PermissionEntry = {
  id: id('view-teachers'),
  feature: 'teacher',
  kind: 'view',
  label: 'View all teacher profiles',
  ownership: 'all',
  ownershipFor: 'teacher',
};

const all: PermissionEntry = {
  id: id('all-teacher'),
  feature: 'teacher',
  kind: 'all',
  label: 'All',
  grants: [view.id],
};

export const teacherFeature: FeatureDefinition = {
  key: 'teacher',
  title: 'Teachers',
  iconName: 'UserCheck',
  editorCategory: 'People',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
  },
};
