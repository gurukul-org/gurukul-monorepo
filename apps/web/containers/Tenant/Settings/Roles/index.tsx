'use client';

import React, { useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { PermissionGate } from '@/components/permission-gate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useShowDeleteModal, useShowRoleModal } from '@/hooks/use-modal';
import { useRequirePermission } from '@/hooks/use-require-permission';
import {
  type Role,
  useDeleteRole,
  useRoles,
} from '@/services/api/requests/roles';
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  Plus,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

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
  const allowed = useRequirePermission({
    permission: PERMS.role.view,
    redirectTo: '/settings/profile',
  });

  const router = useRouter();
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/settings');
  const { data: roles = [], isLoading: loadingRoles } = useRoles();
  const {
    mutateAsync: deleteRole,
    isPending: isDeletingRole,
    variables: deletingRoleId,
  } = useDeleteRole();

  const showDeleteModal = useShowDeleteModal();
  const showRoleModal = useShowRoleModal();
  const [searchQuery, setSearchQuery] = useState('');

  const isMutating = isDeletingRole;

  if (!allowed) return null;

  const handleStartCreate = () => {
    showRoleModal(null);
  };

  const handleStartEdit = (role: Role) => {
    showRoleModal(role);
  };

  const handleDelete = (roleId: string) => {
    showDeleteModal({
      title: 'Delete Custom Role',
      subtitle:
        'Are you sure you want to delete this custom role? This action cannot be undone.',
      confirmButtonText: 'Delete Role',
      onConfirm: async () => {
        try {
          await deleteRole(roleId);
          toast.success('Role deleted successfully');
        } catch (err: unknown) {
          const axiosError = err as {
            response?: { data?: { message?: string | string[] } };
          };
          const msg =
            axiosError.response?.data?.message || 'Failed to delete role';
          toast.error(Array.isArray(msg) ? msg[0] : msg);
          throw err;
        }
      },
    });
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description &&
        role.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

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

        {/* Roles Overview Layout */}
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
      </div>
    </div>
  );
}
