'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { RichTextRenderer } from '@/components/ui/RichTextRenderer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useRequirePermission } from '@/hooks/use-require-permission';
import { useClasses } from '@/services/api/requests/classes';
import {
  StudentSubmissionListItem,
  useAssignment,
  useAssignments,
  useMarkSubmission,
  useSubmissions,
} from '@/services/api/requests/homework';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  ClipboardList,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

export default function SubmissionsPage() {
  useRequirePermission({
    permission: PERMS.homework.mark,
    redirectTo: '/homework',
  });

  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialAssignmentId = searchParams.get('assignmentId') || '';

  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments();

  // Selection state
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedAssignmentId, setSelectedAssignmentId] =
    useState(initialAssignmentId);

  // Grading Modal state
  const [gradingStudent, setGradingStudent] =
    useState<StudentSubmissionListItem | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeRemarks, setGradeRemarks] = useState('');
  const [questionScores, setQuestionScores] = useState<Record<number, number>>(
    {},
  );

  // Handle URL params syncing on load
  useEffect(() => {
    if (initialClassId) setSelectedClassId(initialClassId);
    if (initialAssignmentId) setSelectedAssignmentId(initialAssignmentId);
  }, [initialClassId, initialAssignmentId]);

  // Filter assignments for selected class
  const filteredAssignments =
    assignments?.filter((a) => a.classId === selectedClassId) || [];

  // Reset assignment selection if the selected class changes and current assignment doesn't belong
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedAssignmentId('');
  };

  // Fetch submissions for selected assignment
  const {
    data: submissions,
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useSubmissions(selectedAssignmentId, !!selectedAssignmentId);

  const markSubmission = useMarkSubmission(selectedAssignmentId);

  const { data: currentAssignment } = useAssignment(
    selectedAssignmentId,
    !!selectedAssignmentId,
  );

  // Open modal for grading
  const handleOpenGrading = (student: StudentSubmissionListItem) => {
    setGradingStudent(student);
    setGradeScore(student.submissionDetails?.score?.toString() || '');
    setGradeRemarks(student.submissionDetails?.remarks || '');

    const initialScores: Record<number, number> = {};
    if (student.submissionDetails?.answers) {
      student.submissionDetails.answers.forEach((ans) => {
        initialScores[ans.questionIndex] = ans.score || 0;
      });
    }
    setQuestionScores(initialScores);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingStudent || !gradingStudent.submissionDetails) return;
    if (!gradeScore || isNaN(parseInt(gradeScore))) {
      return toast.error('Please enter a valid numeric score.');
    }
    const scoreVal = parseInt(gradeScore, 10);
    if (currentAssignment && scoreVal > currentAssignment.marks) {
      return toast.error(
        `Score cannot exceed maximum marks (${currentAssignment.marks}).`,
      );
    }

    const hasQuestions =
      currentAssignment?.questions && currentAssignment.questions.length > 0;
    const submissionAnswers = hasQuestions
      ? currentAssignment.questions.map((q, idx) => {
          const studentAns = gradingStudent.submissionDetails?.answers?.find(
            (a) => a.questionIndex === idx,
          );
          return {
            questionIndex: idx,
            value: studentAns?.value || '',
            score: questionScores[idx] || 0,
          };
        })
      : undefined;

    try {
      await markSubmission.mutateAsync({
        submissionId: gradingStudent.submissionDetails.id,
        dto: {
          score: scoreVal,
          remarks: gradeRemarks || undefined,
          answers: submissionAnswers,
        },
      });

      toast.success(
        `Submission for ${gradingStudent.firstName} ${gradingStudent.lastName} graded.`,
      );
      setGradingStudent(null);
      void refetchSubmissions();
    } catch (err) {
      toast.error('Failed to save grade.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Marked':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Marked
          </span>
        );
      case 'Submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
            Not submitted
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Button asChild size="sm" variant="ghost">
          <Link href="/homework">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to portal
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Review Submissions
          </h1>
          <p className="text-xs text-zinc-500">
            Review student responses, enter scores, and leave feedback comments.
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-900/10 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        {/* Class selector */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="classSelector">1. Select Class</Label>
          <select
            id="classSelector"
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full text-sm rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none"
          >
            <option value="">-- Select Class --</option>
            {classes?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.academicTerm.name})
              </option>
            ))}
          </select>
        </div>

        {/* Assignment selector */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="assignmentSelector">2. Select Assignment</Label>
          <select
            id="assignmentSelector"
            value={selectedAssignmentId}
            disabled={!selectedClassId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full text-sm rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-900/40"
          >
            <option value="">-- Select Assignment --</option>
            {filteredAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} (Max: {a.marks} points)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {!selectedAssignmentId ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950/10">
          <ClipboardList className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No assignment selected
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Please choose a class and assignment above to view submissions.
          </p>
        </div>
      ) : submissionsLoading ? (
        <div className="text-center py-16 text-zinc-500">
          Loading student list and submissions...
        </div>
      ) : !submissions || submissions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-rose-200 rounded-xl bg-rose-50/10">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400 mb-3" />
          <h3 className="text-sm font-semibold text-rose-900">
            No students found
          </h3>
          <p className="text-xs text-rose-500 mt-1">
            There are no active students enrolled in this class.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
              <TableRow>
                <TableHead className="font-semibold w-[120px]">
                  Roll Number
                </TableHead>
                <TableHead className="font-semibold">Student Name</TableHead>
                <TableHead className="font-semibold">Email Address</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center w-[120px]">
                  Score
                </TableHead>
                <TableHead className="text-right font-semibold w-[150px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow
                  key={sub.studentProfileId}
                  className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10"
                >
                  <TableCell className="font-medium">
                    {sub.rollNumber}
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sub.firstName} {sub.lastName}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {sub.email}
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="text-center font-bold text-sm">
                    {sub.status === 'Marked' &&
                    sub.submissionDetails?.score !== null ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {sub.submissionDetails?.score}{' '}
                        <span className="text-xs text-zinc-400">
                          / {currentAssignment?.marks}
                        </span>
                      </span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {sub.status !== 'Not submitted' && sub.submissionDetails ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenGrading(sub)}
                        variant={
                          sub.status === 'Marked' ? 'outline' : 'default'
                        }
                        className={
                          sub.status === 'Submitted'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white font-medium'
                            : ''
                        }
                      >
                        {sub.status === 'Marked'
                          ? 'Edit Grade'
                          : 'Grade / Review'}
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-600 italic px-3">
                        No action
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grading Modal Dialog */}
      <Dialog
        open={!!gradingStudent}
        onOpenChange={(open) => !open && setGradingStudent(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Grade Submission: {gradingStudent?.firstName}{' '}
              {gradingStudent?.lastName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review responses below and input points with teacher remarks
              feedback.
            </DialogDescription>
          </DialogHeader>

          {/* Answers review scrollable wrapper */}
          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 my-2 border-y border-zinc-100 dark:border-zinc-800">
            {/* Assignment description reference (general instructions) */}
            {currentAssignment?.description &&
              currentAssignment.description !== '<p></p>' && (
                <div className="space-y-2 p-3.5 bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Assignment Instructions / Description
                  </div>
                  <RichTextRenderer content={currentAssignment.description} />
                </div>
              )}

            {currentAssignment?.questions &&
            currentAssignment.questions.length > 0 ? (
              // Multi-question view and individual question scoring
              <div className="space-y-5">
                {currentAssignment.questions.map((question, idx) => {
                  const studentAns =
                    gradingStudent?.submissionDetails?.answers?.find(
                      (a) => a.questionIndex === idx,
                    );
                  const currentScore =
                    questionScores[idx] ?? studentAns?.score ?? 0;

                  const handleScoreChange = (valStr: string) => {
                    const val = parseInt(valStr, 10) || 0;
                    const newScores = { ...questionScores, [idx]: val };
                    setQuestionScores(newScores);

                    // Re-calculate the total accumulated score
                    const totalSum = currentAssignment.questions.reduce(
                      (sum, q, qIdx) => {
                        return (
                          sum + (qIdx === idx ? val : newScores[qIdx] || 0)
                        );
                      },
                      0,
                    );
                    setGradeScore(totalSum.toString());
                  };

                  return (
                    <div
                      key={question.id || idx}
                      className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/5 space-y-3"
                    >
                      <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-2 gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            Question {idx + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 whitespace-pre-wrap">
                            {question.text}
                          </h4>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800 shrink-0">
                          Max: {question.marks} Marks
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Student's Answer
                        </span>
                        <RichTextRenderer
                          content={studentAns?.value || ''}
                          className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-sm min-h-[60px]"
                        />
                      </div>

                      {question.referenceAnswer && (
                        <div className="p-2.5 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-950 rounded-lg space-y-0.5">
                          <span className="text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                            Reference Answer / Solution
                          </span>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                            {question.referenceAnswer}
                          </p>
                        </div>
                      )}

                      {/* Question Score input */}
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/40 w-full max-w-[200px]">
                        <Label
                          htmlFor={`score-${idx}`}
                          className="text-xs font-semibold text-zinc-650 shrink-0"
                        >
                          Score:
                        </Label>
                        <div className="relative flex-1">
                          <Input
                            id={`score-${idx}`}
                            type="number"
                            min="0"
                            max={question.marks}
                            value={currentScore}
                            onChange={(e) => handleScoreChange(e.target.value)}
                            placeholder="0"
                            className="bg-white dark:bg-zinc-950 pr-8 text-xs font-bold h-8"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-zinc-400 font-bold">
                            / {question.marks}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Legacy/single-question fallback
              <div className="space-y-2 p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/10">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Student's Submitted Work
                </div>
                <RichTextRenderer
                  content={
                    gradingStudent?.submissionDetails?.answers?.[0]?.value
                  }
                  className="p-3 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* Submission and Grading Form */}
          <form onSubmit={handleGradeSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-4 items-end">
              {/* Score Input */}
              <div className="flex flex-col gap-1.5 col-span-1">
                <Label htmlFor="gradeScoreInput">
                  {currentAssignment?.questions &&
                  currentAssignment.questions.length > 0
                    ? 'Total Score (Accumulated)'
                    : `Score (Max: ${currentAssignment?.marks || 0})`}
                </Label>
                <div className="relative">
                  <Input
                    id="gradeScoreInput"
                    type="number"
                    min="0"
                    max={currentAssignment?.marks}
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    disabled={
                      !!(
                        currentAssignment?.questions &&
                        currentAssignment.questions.length > 0
                      )
                    }
                    placeholder="Score"
                    className={`bg-white dark:bg-zinc-950 pr-12 font-bold text-sm ${
                      currentAssignment?.questions &&
                      currentAssignment.questions.length > 0
                        ? 'opacity-80 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/50'
                        : ''
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-zinc-455">
                    / {currentAssignment?.marks}
                  </span>
                </div>
              </div>

              {/* Submitted Time indicator */}
              <div className="col-span-2 text-xs text-zinc-400 pb-2">
                Submitted on:{' '}
                <span className="font-semibold">
                  {gradingStudent?.submissionDetails?.submittedAt
                    ? formatDate(gradingStudent.submissionDetails.submittedAt)
                    : ''}
                </span>
              </div>
            </div>

            {/* Remarks Textarea */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="remarksTextarea">Feedback Remarks</Label>
              <Textarea
                id="remarksTextarea"
                value={gradeRemarks}
                onChange={(e) => setGradeRemarks(e.target.value)}
                placeholder="Good effort! To score higher, try elaborating with examples."
                className="bg-white dark:bg-zinc-950 min-h-[80px]"
              />
            </div>

            {/* Modal actions */}
            <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGradingStudent(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={markSubmission.isPending}
                className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
              >
                {markSubmission.isPending ? 'Saving...' : 'Submit Grade'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
