import { FeatureDefinition, PermissionEntry, id } from "../types";

const view: PermissionEntry = {
  id: id("view-roles"),
  feature: "role",
  kind: "view",
  label: "View roles",
};

const create: PermissionEntry = {
  id: id("create-roles"),
  feature: "role",
  kind: "create",
  label: "Create custom roles",
};

const edit: PermissionEntry = {
  id: id("edit-roles"),
  feature: "role",
  kind: "edit",
  label: "Edit roles and assign permissions",
};

const deletePerm: PermissionEntry = {
  id: id("delete-roles"),
  feature: "role",
  kind: "delete",
  label: "Delete roles",
};

const all: PermissionEntry = {
  id: id("all-role"),
  feature: "role",
  kind: "all",
  label: "All",
  grants: [view.id, create.id, edit.id, deletePerm.id],
};

export const roleFeature: FeatureDefinition = {
  key: "role",
  title: "Roles",
  iconName: "Shield",
  editorCategory: "Admin",
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [create.id]: create,
    [edit.id]: edit,
    [deletePerm.id]: deletePerm,
  },
};
