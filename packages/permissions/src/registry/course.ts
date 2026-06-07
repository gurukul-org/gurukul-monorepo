import { FeatureDefinition, PermissionEntry, id } from "../types";

// Courses have view-all vs view-own (faculty sees assigned, students see enrolled).

const view: PermissionEntry = {
  id: id("view-courses"),
  feature: "course",
  kind: "view",
  label: "View all courses",
  ownership: "all",
  ownershipFor: "course",
};

const viewOwn: PermissionEntry = {
  id: id("view-own-courses"),
  feature: "course",
  kind: "view-own",
  label: "View assigned/enrolled courses",
  ownership: "own",
  ownershipFor: "course",
};

const create: PermissionEntry = {
  id: id("create-courses"),
  feature: "course",
  kind: "create",
  label: "Create courses",
};

const edit: PermissionEntry = {
  id: id("edit-courses"),
  feature: "course",
  kind: "edit",
  label: "Edit courses",
};

const deletePerm: PermissionEntry = {
  id: id("delete-courses"),
  feature: "course",
  kind: "delete",
  label: "Delete courses",
};

const all: PermissionEntry = {
  id: id("all-course"),
  feature: "course",
  kind: "all",
  label: "All",
  grants: [view.id, viewOwn.id, create.id, edit.id, deletePerm.id],
};

export const courseFeature: FeatureDefinition = {
  key: "course",
  title: "Courses",
  iconName: "BookOpen",
  editorCategory: "Academics",
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
