'use client';

import { useRevokeUserAccess } from '@/services/api/requests/users';

import ConfirmationModal from '../ConfirmationModal';

interface RevokeAccessModalProps {
  membershipId: string;
  userFullName: string;
}

export default function RevokeAccessModal({
  membershipId,
  userFullName,
}: RevokeAccessModalProps) {
  const { mutateAsync: revokeAccess } = useRevokeUserAccess();

  const handleConfirm = async () => {
    await revokeAccess(membershipId);
  };

  return (
    <ConfirmationModal
      title="Revoke Workspace Access"
      subtitle={
        <span>
          Are you sure you want to revoke workspace access for{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {userFullName}
          </span>
          ?
          <br />
          <br />
          This will immediately terminate all active sessions for this user in
          this tenant workspace and block them from re-entering. This action
          cannot be undone.
        </span>
      }
      confirmButtonText="Revoke Access"
      onConfirm={handleConfirm}
    />
  );
}
