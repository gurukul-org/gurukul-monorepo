import { FeatureDefinition, PermissionEntry, id } from "../types";

const view: PermissionEntry = {
  id: id("view-parents"),
  feature: "parent",
  kind: "view",
  label: "View all parent profiles",
  ownership: "all",
  ownershipFor: "parent",
};

const viewOwn: PermissionEntry = {
  id: id("view-own-parent"),
  feature: "parent",
  kind: "view-own",
  label: "View own parent profile",
  ownership: "own",
  ownershipFor: "parent",
};

const create: PermissionEntry = {
  id: id("create-parents"),
  feature: "parent",
  kind: "create",
  label: "Create parent profiles",
};

const edit: PermissionEntry = {
  id: id("edit-parents"),
  feature: "parent",
  kind: "edit",
  label: "Edit parent profiles",
};

const deletePerm: PermissionEntry = {
  id: id("delete-parents"),
  feature: "parent",
  kind: "delete",
  label: "Delete parent profiles",
};

const all: PermissionEntry = {
  id: id("all-parent"),
  feature: "parent",
  kind: "all",
  label: "All",
  grants: [view.id, viewOwn.id, create.id, edit.id, deletePerm.id],
};

export const parentFeature: FeatureDefinition = {
  key: "parent",
  title: "Parents",
  iconName: "UserPlus",
  editorCategory: "People",
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
