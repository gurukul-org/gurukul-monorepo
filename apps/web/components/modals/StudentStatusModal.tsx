'use client';

import { useState } from 'react';

import { Modal } from '@/components/modals/Modal';
import { Button } from '@/components/ui/button';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import {
  Student,
  useChangeStudentStatus,
} from '@/services/api/requests/students';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['SUSPENDED', 'GRADUATED', 'INACTIVE'],
  SUSPENDED: ['ACTIVE', 'INACTIVE'],
  INACTIVE: ['ACTIVE'],
  GRADUATED: [],
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  GRADUATED: 'Graduated',
  INACTIVE: 'Inactive',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  SUSPENDED:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  GRADUATED:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  INACTIVE:
    'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700',
};

const TERMINAL_STATUSES = new Set(['GRADUATED']);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StudentStatusModalProps {
  student: Student;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudentStatusModal({ student }: StudentStatusModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();
  const { mutateAsync: changeStatus, isPending } = useChangeStudentStatus();

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [enrolmentWarning, setEnrolmentWarning] = useState<{
    message: string;
    targetStatus: string;
  } | null>(null);

  const allowedTargets = STATUS_TRANSITIONS[student.status] ?? [];
  const isTerminal = TERMINAL_STATUSES.has(student.status);

  const handleConfirm = async (targetStatus: string, force = false) => {
    try {
      await changeStatus({
        id: student.id,
        dto: { status: targetStatus, ignoreWarnings: force },
      });
      toast.success(
        `Student status changed to ${STATUS_LABELS[targetStatus]}.`,
      );
      setEnrolmentWarning(null);
      hideModal();
    } catch (err: unknown) {
      // Handle active-enrolment warning (400 with message: 'ACTIVE_ENROLMENTS_WARNING')
      const axiosErr = err as {
        response?: { data?: { message?: string; details?: string } };
      };
      const errData = axiosErr?.response?.data;
      if (errData?.message === 'ACTIVE_ENROLMENTS_WARNING') {
        setEnrolmentWarning({
          message:
            errData.details ||
            'This student has active enrolments. Changing status will not auto-modify them.',
          targetStatus,
        });
        return;
      }
      showError(err);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Change Student Status"
      description={`Current status: ${STATUS_LABELS[student.status] ?? student.status}`}
      size="sm"
    >
      <div className="space-y-4">
        {/* Active enrolment warning banner */}
        {enrolmentWarning && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-900/60">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Warning — Active Enrolments
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  {enrolmentWarning.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setEnrolmentWarning(null)}
                disabled={isPending}
                className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:text-amber-300"
              >
                Go Back
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={() =>
                  handleConfirm(enrolmentWarning.targetStatus, true)
                }
                disabled={isPending}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0"
              >
                {isPending ? 'Saving...' : 'Proceed Anyway'}
              </Button>
            </div>
          </div>
        )}

        {/* Terminal state message */}
        {isTerminal && (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              This student is <strong>Graduated</strong>. This is a terminal
              status and cannot be changed.
            </p>
          </div>
        )}

        {/* Status option buttons */}
        {!isTerminal && !enrolmentWarning && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Select new status
            </p>
            {allowedTargets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No available transitions from the current status.
              </p>
            ) : (
              allowedTargets.map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setSelectedStatus(target)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    selectedStatus === target
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/40 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span>{STATUS_LABELS[target] ?? target}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[target] ?? ''}`}
                  >
                    {target}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Action footer */}
        {!isTerminal && !enrolmentWarning && (
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={hideModal}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => selectedStatus && handleConfirm(selectedStatus)}
              disabled={!selectedStatus || isPending}
            >
              {isPending ? 'Saving...' : 'Apply Status'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
