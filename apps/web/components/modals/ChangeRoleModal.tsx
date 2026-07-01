'use client';

import { useMemo, useState } from 'react';

import { Modal } from '@/components/modals/Modal';
import { useHideModal } from '@/hooks/use-modal';
import {
  type RoleSwap,
  useAddMemberRoles,
  useRemoveMemberRoles,
  useReplaceMemberRoles,
} from '@/services/api/requests/members';
import { useRoles } from '@/services/api/requests/roles';
import { Loader2 } from 'lucide-react';

interface ChangeRoleModalProps {
  membershipId: string;
  currentRoleIds: string[];
  userFullName: string;
}

export function ChangeRoleModal({
  membershipId,
  currentRoleIds,
  userFullName,
}: ChangeRoleModalProps) {
  const hideModal = useHideModal();
  const { data: roles, isLoading } = useRoles();
  const { mutateAsync: addRoles } = useAddMemberRoles();
  const { mutateAsync: removeRoles } = useRemoveMemberRoles();
  const { mutateAsync: replaceRoles } = useReplaceMemberRoles();

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(currentRoleIds),
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (roleId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const hasChanges = useMemo(() => {
    const current = new Set(currentRoleIds);
    if (current.size !== selected.size) return true;
    for (const id of selected) if (!current.has(id)) return true;
    return false;
  }, [currentRoleIds, selected]);

  const handleSave = async () => {
    if (selected.size === 0) return;
    setIsSaving(true);
    try {
      const current = new Set(currentRoleIds);
      const added = Array.from(selected).filter((id) => !current.has(id));
      const removed = currentRoleIds.filter((id) => !selected.has(id));

      if (added.length > 0 && removed.length > 0) {
        // Swap (Replace) roles
        const swaps: RoleSwap[] = [];
        const swapCount = Math.min(added.length, removed.length);
        for (let i = 0; i < swapCount; i++) {
          const removeRoleId = removed[i];
          const addRoleId = added[i];
          if (removeRoleId && addRoleId) {
            swaps.push({ removeRoleId, addRoleId });
          }
        }
        await replaceRoles({ membershipId, swaps });

        // If there are left over additions or removals, execute them
        if (added.length > swapCount) {
          await addRoles({
            membershipId,
            roleIds: added.slice(swapCount),
          });
        }
        if (removed.length > swapCount) {
          await removeRoles({
            membershipId,
            roleIds: removed.slice(swapCount),
          });
        }
      } else if (added.length > 0) {
        // Pure Add roles
        await addRoles({ membershipId, roleIds: added });
      } else if (removed.length > 0) {
        // Pure Remove roles
        await removeRoles({ membershipId, roleIds: removed });
      }
      hideModal();
    } catch (err) {
      console.error('Error changing roles:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Change Roles"
      description={`Update the roles assigned to ${userFullName}.`}
      size="md"
      primaryAction={{
        label: 'Save Roles',
        onClick: handleSave,
        loading: isSaving,
        disabled: isSaving || selected.size === 0 || !hasChanges,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isSaving,
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !roles || roles.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No roles are available in this workspace.
        </p>
      ) : (
        <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
          {roles.map((role) => {
            const checked = selected.has(role.id);
            return (
              <label
                key={role.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-2 py-2 hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/40"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(role.id)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {role.name}
                    {role.isSystemRole && (
                      <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-normal text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        System
                      </span>
                    )}
                  </span>
                  {role.description && (
                    <span className="text-xs text-muted-foreground">
                      {role.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
      {selected.size === 0 && !isLoading && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          At least one role must be assigned.
        </p>
      )}
    </Modal>
  );
}
