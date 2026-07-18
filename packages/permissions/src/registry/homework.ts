import { FeatureDefinition, PermissionEntry, id } from '../types';

const view: PermissionEntry = {
  id: id('view-homework'),
  feature: 'homework',
  kind: 'view',
  label: 'View all homework',
  ownership: 'all',
  ownershipFor: 'homework',
};

const viewOwn: PermissionEntry = {
  id: id('view-own-homework'),
  feature: 'homework',
  kind: 'view-own',
  label: 'View own homework',
  ownership: 'own',
  ownershipFor: 'homework',
};

const create: PermissionEntry = {
  id: id('create-homework'),
  feature: 'homework',
  kind: 'create',
  label: 'Create homework',
};

const edit: PermissionEntry = {
  id: id('edit-homework'),
  feature: 'homework',
  kind: 'edit',
  label: 'Edit homework',
};

const deleteHomework: PermissionEntry = {
  id: id('delete-homework'),
  feature: 'homework',
  kind: 'delete',
  label: 'Delete homework',
};

const submit: PermissionEntry = {
  id: id('submit-homework'),
  feature: 'homework',
  kind: 'custom',
  label: 'Submit homework',
};

const mark: PermissionEntry = {
  id: id('mark-homework'),
  feature: 'homework',
  kind: 'custom',
  label: 'Mark submissions',
};

const all: PermissionEntry = {
  id: id('all-homework'),
  feature: 'homework',
  kind: 'all',
  label: 'All',
  grants: [
    view.id,
    viewOwn.id,
    create.id,
    edit.id,
    deleteHomework.id,
    submit.id,
    mark.id,
  ],
};

export const homeworkFeature: FeatureDefinition = {
  key: 'homework',
  title: 'Homework',
  iconName: 'ClipboardList',
  editorCategory: 'Assessment',
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [viewOwn.id]: viewOwn,
    [create.id]: create,
    [edit.id]: edit,
    [deleteHomework.id]: deleteHomework,
    [submit.id]: submit,
    [mark.id]: mark,
  },
};
