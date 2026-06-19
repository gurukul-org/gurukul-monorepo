'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from '@/components/modals/Modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type PermissionCategory,
  type Role,
  useCreateRole,
  useRolePermissionsRegistry,
  useUpdateRole,
} from '@/services/api/requests/roles';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { type PermissionId, applyDependencies } from '@repo/permissions';

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

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole: Role | null;
}

export function RoleModal({ isOpen, onClose, editingRole }: RoleModalProps) {
  const { data: registry = [], isLoading: loadingRegistry } =
    useRolePermissionsRegistry();

  const { mutateAsync: createRole, isPending: isCreatingRole } =
    useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdatingRole } =
    useUpdateRole();

  const isSaving = isCreatingRole || isUpdatingRole;

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

  useEffect(() => {
    if (isOpen) {
      if (editingRole) {
        reset({
          name: editingRole.name,
          description: editingRole.description || '',
          rank: editingRole.rank,
          permissions: editingRole.permissions,
        });
      } else {
        reset({
          name: '',
          description: '',
          rank: 10,
          permissions: [],
        });
      }
    }
  }, [isOpen, editingRole, reset]);

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
      if (!editingRole) {
        await createRole({
          name: data.name,
          description: data.description,
          rank: data.rank,
          permissions: data.permissions,
        });
        toast.success('Role created successfully');
      } else {
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
      }
      onClose();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = axiosError.response?.data?.message || 'An error occurred';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const isCreating = !editingRole;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        isCreating
          ? 'Create Custom Role'
          : `Edit ${editingRole?.isSystemRole ? 'System' : 'Custom'} Role`
      }
      description="Define the name, priority rank, and actions this role is allowed to perform."
    >
      {loadingRegistry ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">
            Loading registry...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* Left Column: Role Details */}
            <div className="lg:col-span-1 space-y-4">
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
                  rows={4}
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
            </div>

            {/* Right Column: Permission Registry */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="font-semibold text-sm">Permission Registry</h3>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {selectedPermissions.length} selected
                </Badge>
              </div>

              <Accordion type="multiple" className="w-full space-y-3">
                {registry.map((cat: PermissionCategory) => (
                  <AccordionItem
                    key={cat.category}
                    value={cat.category}
                    className="border border-border/40 rounded-lg px-4 bg-background/40"
                  >
                    <AccordionTrigger className="hover:no-underline py-2.5">
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
                                const checked = selectedPermissions.includes(
                                  perm.id,
                                );
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
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
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
          </div>
        </form>
      )}
    </Modal>
  );
}
