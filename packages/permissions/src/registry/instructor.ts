import { FeatureDefinition, PermissionEntry, id } from "../types";

const view: PermissionEntry = {
  id: id("view-instructors"),
  feature: "instructor",
  kind: "view",
  label: "View instructor assignments",
};

const assign: PermissionEntry = {
  id: id("assign-instructors"),
  feature: "instructor",
  kind: "create",
  label: "Assign instructors to classes",
};

const edit: PermissionEntry = {
  id: id("edit-instructors"),
  feature: "instructor",
  kind: "edit",
  label: "Edit instructor assignments",
};

const remove: PermissionEntry = {
  id: id("remove-instructors"),
  feature: "instructor",
  kind: "delete",
  label: "Remove instructor assignments",
};

const all: PermissionEntry = {
  id: id("all-instructor"),
  feature: "instructor",
  kind: "all",
  label: "All",
  grants: [view.id, assign.id, edit.id, remove.id],
};

export const instructorFeature: FeatureDefinition = {
  key: "instructor",
  title: "Instructors",
  iconName: "UserCheck",
  editorCategory: "Academics",
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [assign.id]: assign,
    [edit.id]: edit,
    [remove.id]: remove,
  },
};
