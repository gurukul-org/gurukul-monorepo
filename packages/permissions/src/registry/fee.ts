import { FeatureDefinition, PermissionEntry, id } from "../types";

const view: PermissionEntry = {
  id: id("view-fees"),
  feature: "fee",
  kind: "view",
  label: "View all fee records",
  ownership: "all",
  ownershipFor: "fee",
};

const viewOwn: PermissionEntry = {
  id: id("view-own-fees"),
  feature: "fee",
  kind: "view-own",
  label: "View own fee records",
  ownership: "own",
  ownershipFor: "fee",
};

const create: PermissionEntry = {
  id: id("create-fees"),
  feature: "fee",
  kind: "create",
  label: "Create fee structures and invoices",
};

const edit: PermissionEntry = {
  id: id("edit-fees"),
  feature: "fee",
  kind: "edit",
  label: "Edit fee records",
};

const deletePerm: PermissionEntry = {
  id: id("delete-fees"),
  feature: "fee",
  kind: "delete",
  label: "Delete fee records",
};

const all: PermissionEntry = {
  id: id("all-fee"),
  feature: "fee",
  kind: "all",
  label: "All",
  grants: [view.id, viewOwn.id, create.id, edit.id, deletePerm.id],
};

export const feeFeature: FeatureDefinition = {
  key: "fee",
  title: "Fees",
  iconName: "CreditCard",
  editorCategory: "Operations",
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
