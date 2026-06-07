import { FeatureDefinition, PermissionEntry, id } from "../types";

// Future feature — defining now so permissions are ready when the module is built.

const view: PermissionEntry = {
  id: id("view-reports"),
  feature: "report",
  kind: "view",
  label: "View reports",
};

const all: PermissionEntry = {
  id: id("all-report"),
  feature: "report",
  kind: "all",
  label: "All",
  grants: [view.id],
};

export const reportFeature: FeatureDefinition = {
  key: "report",
  title: "Reports",
  iconName: "BarChart3",
  editorCategory: "Analytics",
  all,
  permissions: {
    [all.id]: all,
    [view.id]: view,
  },
};
