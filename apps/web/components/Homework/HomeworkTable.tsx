'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

export interface HomeworkTableAssignment {
  id: string;
  title: string;
  className: string;
  classId?: string;
  startDate: string;
  endDate: string;
  marks: number;
  submissionCount?: number;
  submissionStatus?: string;
  score?: number | null;
}

interface HomeworkTableProps {
  assignments: HomeworkTableAssignment[];
  isTeacher: boolean;
  showClassName?: boolean;
  onDelete?: (id: string, title: string) => void;
  isDeleting?: boolean;
}

export function HomeworkTable({
  assignments,
  isTeacher,
  showClassName = true,
  onDelete,
  isDeleting = false,
}: HomeworkTableProps) {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Marked':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Marked
          </span>
        );
      case 'Submitted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Not submitted
          </span>
        );
    }
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
      <Table>
        <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
          <TableRow>
            <TableHead className="font-semibold text-xs md:text-sm">
              Assignment Title
            </TableHead>
            {showClassName && (
              <TableHead className="font-semibold text-xs md:text-sm">
                Class
              </TableHead>
            )}
            <TableHead className="font-semibold text-xs md:text-sm">
              Start Date
            </TableHead>
            <TableHead className="font-semibold text-xs md:text-sm">
              Deadline
            </TableHead>
            <TableHead className="font-semibold text-xs md:text-sm text-center">
              Marks
            </TableHead>
            {isTeacher ? (
              <TableHead className="font-semibold text-xs md:text-sm text-center">
                Submissions
              </TableHead>
            ) : (
              <TableHead className="font-semibold text-xs md:text-sm">
                Status
              </TableHead>
            )}
            {isTeacher && onDelete && (
              <TableHead className="w-16 text-right font-semibold text-xs md:text-sm">
                Action
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow
              key={assignment.id}
              onClick={() => router.push(`/homework/${assignment.id}`)}
              className="hover:bg-zinc-50/45 dark:hover:bg-zinc-900/10 cursor-pointer transition-colors"
            >
              <TableCell className="font-semibold text-xs md:text-sm text-zinc-900 dark:text-zinc-50">
                {assignment.title}
              </TableCell>
              {showClassName && (
                <TableCell className="text-xs md:text-sm text-zinc-650 dark:text-zinc-350">
                  {assignment.className}
                </TableCell>
              )}
              <TableCell className="text-[10px] md:text-xs text-zinc-600 dark:text-zinc-400">
                {formatDate(assignment.startDate)}
              </TableCell>
              <TableCell className="text-[10px] md:text-xs text-zinc-600 dark:text-zinc-400">
                <span
                  className={
                    new Date() > new Date(assignment.endDate)
                      ? 'text-rose-500 font-medium'
                      : ''
                  }
                >
                  {formatDate(assignment.endDate)}
                </span>
              </TableCell>
              <TableCell className="text-center font-semibold text-xs md:text-sm text-zinc-800 dark:text-zinc-200">
                {assignment.marks}
              </TableCell>
              {isTeacher ? (
                <TableCell
                  className="text-center font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/homework/submissions?classId=${assignment.classId || ''}&assignmentId=${assignment.id}`}
                    className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded"
                  >
                    {assignment.submissionCount ?? 0} Submissions
                  </Link>
                </TableCell>
              ) : (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-1 items-start">
                    {getStatusBadge(assignment.submissionStatus)}
                    {assignment.submissionStatus === 'Marked' &&
                      assignment.score !== null && (
                        <span className="text-[10px] text-zinc-500">
                          Score: {assignment.score} / {assignment.marks}
                        </span>
                      )}
                  </div>
                </TableCell>
              )}
              {isTeacher && onDelete && (
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(assignment.id, assignment.title)}
                    disabled={isDeleting}
                    className="text-rose-600 hover:text-rose-750 hover:bg-rose-55 dark:hover:bg-rose-950/20 h-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
