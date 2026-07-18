'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { RichTextRenderer } from '@/components/ui/RichTextRenderer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { usePermission } from '@/hooks/use-permission';
import { useRequirePermission } from '@/hooks/use-require-permission';
import {
  useAssignment,
  useSubmitAssignment,
} from '@/services/api/requests/homework';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Eye,
  Milestone,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

export default function HomeworkDetailPage() {
  useRequirePermission({
    permission: PERMS.homework.viewOwn,
    redirectTo: '/homework',
  });

  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { hasPermission } = usePermission();
  const isTeacher = hasPermission(PERMS.homework.create);

  const { data: assignment, isLoading, error } = useAssignment(id);
  const submitAssignment = useSubmitAssignment(id);

  // Submission Content State for multiple questions
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Initialize submission content when assignment loads
  useEffect(() => {
    if (assignment?.submission?.answers) {
      const answersMap: Record<number, string> = {};
      assignment.submission.answers.forEach((ans) => {
        answersMap[ans.questionIndex] = ans.value || '';
      });
      setAnswers(answersMap);
    } else {
      setAnswers({});
    }
  }, [assignment]);

  const handleHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasQuestions =
      assignment?.questions && assignment.questions.length > 0;

    if (hasQuestions) {
      for (let i = 0; i < assignment.questions.length; i++) {
        const val = answers[i] || '';
        if (!val || val.trim() === '' || val === '<p></p>') {
          return toast.error(
            `Please answer Question ${i + 1} before submitting.`,
          );
        }
      }
    } else {
      const firstAnswer = answers[0] || '';
      if (
        !firstAnswer ||
        firstAnswer.trim() === '' ||
        firstAnswer === '<p></p>'
      ) {
        return toast.error('Please enter your response before submitting.');
      }
    }

    try {
      const submissionAnswers = hasQuestions
        ? assignment.questions.map((_, idx) => ({
            questionIndex: idx,
            value: answers[idx] || '',
          }))
        : [{ questionIndex: 0, value: answers[0] || '' }];

      await submitAssignment.mutateAsync({
        answers: submissionAnswers,
      });
      toast.success('Your homework has been submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit homework.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-zinc-500 animate-pulse flex items-center gap-2">
          <ClipboardList className="h-5 w-5 animate-bounce" /> Loading
          assignment details...
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="text-red-500 text-center py-8">
        Assignment not found or failed to load details.
      </div>
    );
  }

  const deadlinePassed = new Date() > new Date(assignment.endDate);
  const alreadySubmitted = !!assignment.submission;
  const isMarked = assignment.submission?.status === 'MARKED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Button asChild size="sm" variant="ghost">
          <Link href="/homework">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {assignment.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Class:{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {assignment.className}
            </span>
          </p>
        </div>
        {isTeacher && (
          <Button
            asChild
            size="sm"
            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950"
          >
            <Link
              href={`/homework/submissions?classId=${assignment.classId}&assignmentId=${assignment.id}`}
            >
              <Eye className="h-4 w-4 mr-1.5" /> View Submissions
            </Link>
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col justify-center">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
            Start Date
          </span>
          <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium mt-0.5">
            {formatDate(assignment.startDate)}
          </span>
        </div>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col justify-center">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
            End Date (Deadline)
          </span>
          <span
            className={`text-xs font-semibold mt-0.5 ${deadlinePassed ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}`}
          >
            {formatDate(assignment.endDate)}
          </span>
        </div>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col justify-center">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
            Max Score Marks
          </span>
          <span className="text-sm text-zinc-900 dark:text-zinc-100 font-bold mt-0.5">
            {assignment.marks} Points
          </span>
        </div>
      </div>

      {/* Description / Instructions (HTML Rich Text) */}
      {assignment.description && assignment.description !== '<p></p>' && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 bg-zinc-50/10">
          <h3 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
            General Instructions / Description
          </h3>
          <RichTextRenderer content={assignment.description} />
        </div>
      )}

      {/* Grading Feedback Panel (for student if marked) */}
      {!isTeacher && isMarked && (
        <div className="border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xl p-5 space-y-3 flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
              Assignment Graded
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-400">
              Your teacher reviewed and scored your homework:
            </p>
            <div className="text-lg font-extrabold text-emerald-900 dark:text-emerald-200 mt-2">
              Score: {assignment.submission?.score} / {assignment.marks}
            </div>
            {assignment.submission?.remarks && (
              <div className="text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-emerald-100 dark:border-emerald-950 p-3 rounded-lg mt-2 italic">
                &ldquo;{assignment.submission.remarks}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission Status Alert */}
      {!isTeacher && !alreadySubmitted && deadlinePassed && (
        <div className="border border-rose-200 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/10 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-rose-950 dark:text-rose-300">
              Submission Blocked
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              The deadline for this assignment has passed. Submissions are no
              longer accepted.
            </p>
          </div>
        </div>
      )}

      {!isTeacher && alreadySubmitted && !isMarked && (
        <div className="border border-blue-200 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-950/10 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-blue-950 dark:text-blue-300">
              Submission Received
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              You submitted this assignment on{' '}
              {formatDate(assignment.submission!.submittedAt)}. It is waiting
              for review.
            </p>
          </div>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleHomeworkSubmit} className="space-y-6">
        <div className="space-y-6 pt-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Your Response
          </h2>

          {assignment.questions && assignment.questions.length > 0 ? (
            <div className="space-y-6">
              {assignment.questions.map((question, idx) => {
                const isReadOnly =
                  isTeacher || alreadySubmitted || deadlinePassed;
                const studentAnswerVal = answers[idx] || '';
                const studentAnswerObj = assignment.submission?.answers?.find(
                  (a) => a.questionIndex === idx,
                );
                const questionScore = studentAnswerObj?.score;

                return (
                  <div
                    key={question.id || idx}
                    className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/5 space-y-4"
                  >
                    <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          Question {idx + 1}
                        </span>
                        <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                          {question.text}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800">
                          {question.marks} Marks
                        </span>
                        {isMarked && questionScore !== undefined && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            Score: {questionScore} / {question.marks}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {isReadOnly ? (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">
                            Your Answer
                          </Label>
                          <RichTextRenderer
                            content={studentAnswerVal}
                            className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-sm min-h-[80px]"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">
                            Write your answer here
                          </Label>
                          <RichTextEditor
                            value={studentAnswerVal}
                            onChange={(val) =>
                              setAnswers((prev) => ({ ...prev, [idx]: val }))
                            }
                            disabled={submitAssignment.isPending}
                            placeholder="Type your question answer/submission details..."
                          />
                        </div>
                      )}
                    </div>

                    {isMarked && question.referenceAnswer && (
                      <div className="mt-3 p-3.5 bg-blue-55/30 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-950 rounded-lg space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                          Reference Answer / Solution
                        </span>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {question.referenceAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {isTeacher || alreadySubmitted || deadlinePassed ? (
                <div className="space-y-3 p-4 border border-zinc-100 dark:border-zinc-900 bg-zinc-50/10 rounded-xl">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase block mb-1">
                    Submitted Answer
                  </Label>
                  <RichTextRenderer
                    content={answers[0] || ''}
                    className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-md text-sm min-h-[100px]"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase block mb-1">
                    Write your answer here
                  </Label>
                  <RichTextEditor
                    value={answers[0] || ''}
                    onChange={(val) =>
                      setAnswers((prev) => ({ ...prev, [0]: val }))
                    }
                    disabled={submitAssignment.isPending}
                    placeholder="Type your homework answer/submission details..."
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        {!isTeacher && !alreadySubmitted && !deadlinePassed && (
          <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <Button asChild variant="outline">
              <Link href="/homework">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={submitAssignment.isPending}
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
            >
              {submitAssignment.isPending
                ? 'Submitting...'
                : 'Submit Assignment'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
