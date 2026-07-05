'use client';

import { useSuspendMember } from '@/services/api/requests/users';

import ConfirmationModal from '../ConfirmationModal';

interface SuspendMemberModalProps {
  membershipId: string;
  userFullName: string;
}

export default function SuspendMemberModal({
  membershipId,
  userFullName,
}: SuspendMemberModalProps) {
  const { mutateAsync: suspendMember } = useSuspendMember();

  const handleConfirm = async () => {
    await suspendMember(membershipId);
  };

  return (
    <ConfirmationModal
      title="Suspend Member"
      subtitle={
        <span>
          Are you sure you want to suspend{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {userFullName}
          </span>
          ?
          <br />
          <br />
          They will be signed out of this workspace immediately and blocked from
          re-entering until reactivated. You can reactivate them at any time.
        </span>
      }
      confirmButtonText="Suspend Member"
      onConfirm={handleConfirm}
    />
  );
}
