'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { usePathname, useRouter } from 'next/navigation';

import { PermissionGate } from '@/components/permission-gate';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type PermissionCategory,
  type Role,
  useCreateRole,
  useDeleteRole,
  useRolePermissionsRegistry,
  useRoles,
  useUpdateRole,
} from '@/services/api/requests/roles';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  Info,
  Plus,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { PERMS, type PermissionId, applyDependencies } from '@repo/permissions';

const roleFormSchema = z.object({
  name: z.string().min(1, 'Role title is required'),
  description: z.string(),
  rank: z
    .number()
    .min(1, 'Rank must be at least 1')
    .max(100, 'Rank cannot exceed 100'),
  permissions: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

function RoleCardSkeleton() {
  return (
    <Card className="border-border/60 shadow-md bg-card/40 backdrop-blur-md flex flex-col justify-between h-[220px] animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/2 bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-3.5 w-1/4 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <Skeleton className="h-3 w-full bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-border/20">
          <Skeleton className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function RolesContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/settings');
  const { data: roles = [], isLoading: loadingRoles } = useRoles();
  const { data: registry = [], isLoading: loadingRegistry } =
    useRolePermissionsRegistry();

  const { mutateAsync: createRole, isPending: isCreatingRole } =
    useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdatingRole } =
    useUpdateRole();
  const {
    mutateAsync: deleteRole,
    isPending: isDeletingRole,
    variables: deletingRoleId,
  } = useDeleteRole();

  const isSaving = isCreatingRole || isUpdatingRole;
  const isMutating = isSaving || isDeletingRole;

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      rank: 10,
      permissions: [],
    },
  });

  const selectedPermissions = watch('permissions') || [];

  const handleStartCreate = () => {
    reset({
      name: '',
      description: '',
      rank: 10,
      permissions: [],
    });
    setIsCreating(true);
    setEditingRole(null);
  };

  const handleStartEdit = (role: Role) => {
    setEditingRole(role);
    setIsCreating(false);
    reset({
      name: role.name,
      description: role.description || '',
      rank: role.rank,
      permissions: role.permissions,
    });
  };

  const handlePermissionToggle = (permId: string) => {
    const nextPerms = new Set(selectedPermissions);
    if (nextPerms.has(permId)) {
      nextPerms.delete(permId);
    } else {
      nextPerms.add(permId);
      applyDependencies(permId as PermissionId, nextPerms);
    }
    setValue('permissions', Array.from(nextPerms), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSelectAllForFeature = (
    featurePerms: string[],
    select: boolean,
  ) => {
    const nextPerms = new Set(selectedPermissions);
    if (select) {
      featurePerms.forEach((id) => {
        nextPerms.add(id);
        applyDependencies(id as PermissionId, nextPerms);
      });
    } else {
      featurePerms.forEach((id) => {
        nextPerms.delete(id);
      });
    }
    setValue('permissions', Array.from(nextPerms), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onFormSubmit = async (data: RoleFormValues) => {
    try {
      if (isCreating) {
        await createRole({
          name: data.name,
          description: data.description,
          rank: data.rank,
          permissions: data.permissions,
        });
        toast.success('Role created successfully');
        setIsCreating(false);
      } else if (editingRole) {
        // Prepare payload (system roles can only update description and permissions)
        const payload = editingRole.isSystemRole
          ? { description: data.description, permissions: data.permissions }
          : {
              name: data.name,
              description: data.description,
              rank: data.rank,
              permissions: data.permissions,
            };

        await updateRole({ id: editingRole.id, dto: payload });
        toast.success('Role updated successfully');
        setEditingRole(null);
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = axiosError.response?.data?.message || 'An error occurred';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this custom role? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      await deleteRole(roleId);
      toast.success('Role deleted successfully');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = axiosError.response?.data?.message || 'Failed to delete role';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description &&
        role.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (loadingRegistry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            Loading access controls…
          </p>
        </div>
      </div>
    );
  }

  const isFormOpen = isCreating || !!editingRole;

  return (
    <div
      className={
        isSettings
          ? 'pb-12'
          : 'min-h-screen bg-background text-foreground pb-12'
      }
    >
      <div className={isSettings ? '' : 'max-w-6xl mx-auto px-4 py-8'}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {!isSettings && (
            <Button
              variant="ghost"
              size="icon"
              disabled={isMutating}
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1
              className={
                isSettings
                  ? 'text-sm font-semibold tracking-tight'
                  : 'text-3xl font-bold tracking-tight'
              }
            >
              Roles & Permissions
            </h1>
            <p
              className={
                isSettings
                  ? 'text-xs text-muted-foreground mt-1'
                  : 'text-sm text-muted-foreground mt-1'
              }
            >
              Configure access roles, permissions hierarchy, and assign
              capabilities for user accounts.
            </p>
          </div>
        </div>

        {isFormOpen ? (
          /* Create / Edit Form Layout */
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-border/60 shadow-lg bg-card/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isCreating
                      ? 'Create Custom Role'
                      : `Edit ${editingRole?.isSystemRole ? 'System' : 'Custom'} Role`}
                  </CardTitle>
                  <CardDescription>
                    Define the name, priority rank, and baseline capabilities.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Title</Label>
                    <Input
                      id="role-name"
                      {...register('name')}
                      disabled={editingRole?.isSystemRole || isSaving}
                      placeholder="e.g. Exam Superintendent"
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.name.message}
                      </p>
                    )}
                    {editingRole?.isSystemRole && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" /> System role title cannot be
                        modified.
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-desc">Description</Label>
                    <textarea
                      id="role-desc"
                      {...register('description')}
                      disabled={isSaving}
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                      placeholder="Specify the purpose of this role..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-rank">Rank (1-100)</Label>
                    <Input
                      id="role-rank"
                      type="number"
                      min={1}
                      max={100}
                      {...register('rank', { valueAsNumber: true })}
                      disabled={editingRole?.isSystemRole || isSaving}
                    />
                    {errors.rank && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.rank.message}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground block">
                      Lower numbers indicate higher privilege level.
                    </span>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Saving...
                        </span>
                      ) : isCreating ? (
                        'Create Role'
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => {
                        setIsCreating(false);
                        setEditingRole(null);
                        reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border/60 shadow-lg bg-card/60 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      Permission Registry
                    </CardTitle>
                    <CardDescription>
                      Assign feature-specific actions to this role. Dependents
                      automatically apply.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {selectedPermissions.length} selected
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full space-y-4">
                    {registry.map((cat: PermissionCategory) => (
                      <AccordionItem
                        key={cat.category}
                        value={cat.category}
                        className="border border-border/40 rounded-lg px-4 bg-background/40"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <span className="font-semibold text-sm capitalize">
                            {cat.category}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-6">
                          {cat.features.map((feature) => {
                            const featurePermIds = feature.permissions.map(
                              (p) => p.id,
                            );
                            const hasAll = featurePermIds.every((id) =>
                              selectedPermissions.includes(id),
                            );

                            return (
                              <div
                                key={feature.key}
                                className="border-l-2 border-primary/30 pl-4 py-1 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                      {feature.title}
                                    </h4>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={isSaving}
                                    className="text-xs text-muted-foreground h-7 px-2"
                                    onClick={() =>
                                      handleSelectAllForFeature(
                                        featurePermIds,
                                        !hasAll,
                                      )
                                    }
                                  >
                                    {hasAll ? 'Deselect All' : 'Select All'}
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {feature.permissions.map((perm) => {
                                    const checked =
                                      selectedPermissions.includes(perm.id);
                                    return (
                                      <label
                                        key={perm.id}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                          checked
                                            ? 'border-primary/40 bg-primary/5 shadow-sm'
                                            : 'border-border/40 hover:bg-muted/30 bg-background/20'
                                        } ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          disabled={isSaving}
                                          onChange={() =>
                                            handlePermissionToggle(perm.id)
                                          }
                                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                                        />
                                        <div className="space-y-0.5">
                                          <span className="text-xs font-semibold block">
                                            {perm.label}
                                          </span>
                                          {perm.description && (
                                            <span className="text-[10px] text-muted-foreground block leading-normal">
                                              {perm.description}
                                            </span>
                                          )}
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </form>
        ) : (
          /* Roles Overview Layout */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:max-w-xs">
                <Input
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isMutating}
                  className="bg-card/40 border-border/80"
                />
              </div>
              <PermissionGate permission={PERMS.role.create}>
                <Button
                  onClick={handleStartCreate}
                  disabled={isMutating}
                  className="w-full sm:w-auto gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Custom Role
                </Button>
              </PermissionGate>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingRoles ? (
                <>
                  <RoleCardSkeleton />
                  <RoleCardSkeleton />
                  <RoleCardSkeleton />
                </>
              ) : (
                filteredRoles.map((role) => {
                  const isThisRoleDeleting =
                    isDeletingRole && deletingRoleId === role.id;
                  return (
                    <Card
                      key={role.id}
                      className="border-border/60 hover:border-primary/30 transition-all duration-300 shadow-md bg-card/40 backdrop-blur-md flex flex-col justify-between"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg font-bold">
                                {role.name}
                              </CardTitle>
                              {role.isSystemRole && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] py-0 px-1.5"
                                >
                                  System
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              Rank: {role.rank}
                            </span>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Shield className="h-4 w-4" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {role.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/20">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{role.memberCount} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            <span>{role.permissions.length} perms</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <PermissionGate permission={PERMS.role.edit}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1.5 text-xs h-8"
                              disabled={isMutating}
                              onClick={() => handleStartEdit(role)}
                            >
                              <Edit className="h-3 w-3" /> Edit
                            </Button>
                          </PermissionGate>

                          {!role.isSystemRole && (
                            <PermissionGate permission={PERMS.role.delete}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3"
                                disabled={isMutating}
                                onClick={() => handleDelete(role.id)}
                              >
                                {isThisRoleDeleting ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </PermissionGate>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {!loadingRoles && filteredRoles.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border/40 rounded-xl bg-card/20">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-semibold">No Roles Found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search criteria or create a new role.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
