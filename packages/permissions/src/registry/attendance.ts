import { FeatureDefinition, PermissionEntry, id } from "../types";

// Future feature — defining now so permissions are ready when the module is built.

const view: PermissionEntry = {
  id: id("view-attendance"),
  feature: "attendance",
  kind: "view",
  label: "View all attendance records",
  ownership: "all",
  ownershipFor: "attendance",
};

const viewOwn: PermissionEntry = {
  id: id("view-own-attendance"),
  feature: "attendance",
  kind: "view-own",
  label: "View own attendance",
  ownership: "own",
  ownershipFor: "attendance",
};

const mark: PermissionEntry = {
  id: id("mark-attendance"),
  feature: "attendance",
  kind: "create",
  label: "Mark attendance",
};

const edit: PermissionEntry = {
  id: id("edit-attendance"),
  feature: "attendance",
  kind: "edit",
  label: "Edit attendance records",
};

const all: PermissionEntry = {
  id: id("all-attendance"),
  feature: "attendance",
  kind: "all",
  label: "All",
  grants: [view.id, viewOwn.id, mark.id, edit.id],
};

export const attendanceFeature: FeatureDefinition = {
  key: "attendance",
  title: "Attendance",
  iconName: "CheckSquare",
  editorCategory: "Operations",
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
    [viewOwn.id]: viewOwn,
    [mark.id]: mark,
    [edit.id]: edit,
  },
};
