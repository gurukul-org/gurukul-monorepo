'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRequirePermission } from '@/hooks/use-require-permission';
import { useClasses } from '@/services/api/requests/classes';
import { useCreateAssignment } from '@/services/api/requests/homework';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

export default function CreateHomeworkPage() {
  useRequirePermission({
    permission: PERMS.homework.create,
    redirectTo: '/homework',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const createAssignment = useCreateAssignment();
  const { data: classes, isLoading: classesLoading } = useClasses();

  // Helper to generate safe client-side unique IDs
  const generateId = () => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
  };

  // Form State
  const [classId, setClassId] = useState(initialClassId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Questions State
  const [questions, setQuestions] = useState<
    Array<{ id: string; text: string; marks: number; referenceAnswer?: string }>
  >([{ id: generateId(), text: '', marks: 10, referenceAnswer: '' }]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: generateId(), text: '', marks: 10, referenceAnswer: '' },
    ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: string, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  const calculatedMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classId) return toast.error('Please select a target class.');
    if (!title) return toast.error('Please specify an assignment title.');

    if (questions.length === 0) {
      return toast.error('Please add at least one question.');
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || !q.text.trim()) {
        return toast.error(`Please enter text for Question ${i + 1}.`);
      }
      if (q.marks < 0) {
        return toast.error(`Question ${i + 1} must have 0 or more marks.`);
      }
    }

    if (!startDate) return toast.error('Please specify a start date.');
    if (!endDate) return toast.error('Please specify an end date / deadline.');
    if (calculatedMarks <= 0) {
      return toast.error('Total assignment marks must be greater than 0.');
    }

    try {
      await createAssignment.mutateAsync({
        classId,
        title,
        description: description || '',
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        marks: calculatedMarks,
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          marks: q.marks,
          referenceAnswer: q.referenceAnswer || undefined,
        })),
      });

      toast.success('Assignment created successfully!');
      router.push('/homework');
    } catch (err) {
      toast.error('Failed to create assignment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Button asChild size="sm" variant="ghost">
          <Link href="/homework">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to list
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create Homework Assignment
          </h1>
          <p className="text-xs text-zinc-500">
            Assign homework to a class with rich text instructions and
            questions.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Class Selector */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="classSelect">Target Class/Section</Label>
            <select
              id="classSelect"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full text-sm rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
            >
              <option value="">-- Select Class --</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.academicTerm.name})
                </option>
              ))}
            </select>
          </div>

          {/* Maximum Marks */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="marksInput">Maximum Marks (Accumulated)</Label>
            <Input
              id="marksInput"
              type="number"
              value={calculatedMarks}
              disabled
              className="bg-zinc-50 dark:bg-zinc-900/50 opacity-80 cursor-not-allowed font-bold"
            />
          </div>
        </div>

        {/* Assignment Title */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="titleInput">Assignment Title</Label>
          <Input
            id="titleInput"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. History Midterm Essay"
            className="bg-white dark:bg-zinc-950"
          />
        </div>

        {/* Description/Instructions - Rich Text Editor */}
        <div className="flex flex-col gap-2">
          <Label>General Instructions / Assignment Description</Label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Describe the homework assignment, general guidelines, and instructions here..."
          />
        </div>

        {/* Questions Section */}
        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
                Assignment Questions
              </h2>
              <p className="text-xs text-zinc-500">
                Add one or more questions. Each question will have its own
                student submission box and marks.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              + Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/5 rounded-xl space-y-3 relative group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Question {index + 1}
                  </span>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="text-rose-600 hover:text-rose-750 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7 px-2"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Question Text */}
                  <div className="flex flex-col gap-1.5 md:col-span-3">
                    <Label
                      htmlFor={`q-${question.id}-text`}
                      className="text-xs text-zinc-500"
                    >
                      Question Text
                    </Label>
                    <textarea
                      id={`q-${question.id}-text`}
                      value={question.text}
                      onChange={(e) =>
                        handleQuestionChange(
                          question.id,
                          'text',
                          e.target.value,
                        )
                      }
                      placeholder="Write question content..."
                      rows={2}
                      className="w-full text-sm rounded-md border border-zinc-250 dark:border-zinc-800 px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
                    />
                  </div>

                  {/* Question Marks */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`q-${question.id}-marks`}
                      className="text-xs text-zinc-500"
                    >
                      Marks
                    </Label>
                    <Input
                      id={`q-${question.id}-marks`}
                      type="number"
                      min="0"
                      value={question.marks}
                      onChange={(e) =>
                        handleQuestionChange(
                          question.id,
                          'marks',
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                      placeholder="e.g. 10"
                      className="bg-white dark:bg-zinc-950"
                    />
                  </div>
                </div>

                {/* Reference Answer */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <Label
                    htmlFor={`q-${question.id}-ans`}
                    className="text-xs text-zinc-500"
                  >
                    Reference Answer / Model Solution (Optional)
                  </Label>
                  <textarea
                    id={`q-${question.id}-ans`}
                    value={question.referenceAnswer}
                    onChange={(e) =>
                      handleQuestionChange(
                        question.id,
                        'referenceAnswer',
                        e.target.value,
                      )
                    }
                    placeholder="Provide reference/correct answer context for student post-grading review..."
                    rows={2}
                    className="w-full text-xs rounded-md border border-zinc-250 dark:border-zinc-800 px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="startDateInput">Start Date & Time</Label>
            <Input
              id="startDateInput"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white dark:bg-zinc-950 w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="endDateInput">End Date (Deadline)</Label>
            <Input
              id="endDateInput"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white dark:bg-zinc-950 w-full"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <Button asChild variant="outline">
            <Link href="/homework">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={createAssignment.isPending}
            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
          >
            {createAssignment.isPending ? 'Saving...' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
