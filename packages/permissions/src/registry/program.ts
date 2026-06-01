import { FeatureDefinition, PermissionEntry, id } from "../types";

const view: PermissionEntry = {
  id: id("view-programs"),
  feature: "program",
  kind: "view",
  label: "View programs",
};

const create: PermissionEntry = {
  id: id("create-programs"),
  feature: "program",
  kind: "create",
  label: "Create programs",
};

const edit: PermissionEntry = {
  id: id("edit-programs"),
  feature: "program",
  kind: "edit",
  label: "Edit programs",
};

const deletePerm: PermissionEntry = {
  id: id("delete-programs"),
  feature: "program",
  kind: "delete",
  label: "Delete programs",
};

const all: PermissionEntry = {
  id: id("all-program"),
  feature: "program",
  kind: "all",
  label: "All",
  grants: [view.id, create.id, edit.id, deletePerm.id],
};

export const programFeature: FeatureDefinition = {
  key: "program",
  title: "Programs",
  iconName: "GraduationCap",
  editorCategory: "Academics",
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [create.id]: create,
    [edit.id]: edit,
    [deletePerm.id]: deletePerm,
  },
};
