'use client';

import { AlertTriangle } from 'lucide-react';

import ConfirmationModal from '../ConfirmationModal';

interface DeleteModalProps {
  title: string;
  subtitle: string;
  confirmButtonText?: string;
  onConfirm: () => void | Promise<void>;
}

export default function DeleteModal({
  title,
  subtitle,
  confirmButtonText = 'Delete',
  onConfirm,
}: DeleteModalProps) {
  return (
    <ConfirmationModal
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{title}</span>
        </span>
      }
      subtitle={subtitle}
      confirmButtonText={confirmButtonText}
      onConfirm={onConfirm}
    />
  );
}
