import { FeatureDefinition, PermissionEntry, id } from '../types';

const view: PermissionEntry = {
  id: id('view-dashboard'),
  feature: 'dashboard',
  kind: 'view',
  label: 'View institutional dashboard',
};

const viewOwn: PermissionEntry = {
  id: id('view-own-dashboard'),
  feature: 'dashboard',
  kind: 'view-own',
  label: 'View own dashboard',
  ownership: 'own',
  ownershipFor: 'dashboard',
};

const all: PermissionEntry = {
  id: id('all-dashboard'),
  feature: 'dashboard',
  kind: 'all',
  label: 'All',
  grants: [view.id, viewOwn.id],
};

export const dashboardFeature: FeatureDefinition = {
  key: 'dashboard',
  title: 'Dashboard',
  iconName: 'LayoutDashboard',
  editorCategory: 'Analytics',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [viewOwn.id]: viewOwn,
  },
};
