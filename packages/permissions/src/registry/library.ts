import { FeatureDefinition, PermissionEntry, id } from "../types";

const view: PermissionEntry = {
  id: id("view-library"),
  feature: "library",
  kind: "view",
  label: "View library catalog",
};

const create: PermissionEntry = {
  id: id("create-library"),
  feature: "library",
  kind: "create",
  label: "Add library resources",
};

const edit: PermissionEntry = {
  id: id("edit-library"),
  feature: "library",
  kind: "edit",
  label: "Edit library resources",
};

const deletePerm: PermissionEntry = {
  id: id("delete-library"),
  feature: "library",
  kind: "delete",
  label: "Delete library resources",
};

const all: PermissionEntry = {
  id: id("all-library"),
  feature: "library",
  kind: "all",
  label: "All",
  grants: [view.id, create.id, edit.id, deletePerm.id],
};

export const libraryFeature: FeatureDefinition = {
  key: "library",
  title: "Library",
  iconName: "Library",
  editorCategory: "Operations",
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [create.id]: create,
    [edit.id]: edit,
    [deletePerm.id]: deletePerm,
  },
};
