'use client';

import { useEffect, useRef, useState } from 'react';

import { Modal } from '@/components/modals/Modal';
import { Button } from '@/components/ui/button';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal, useModalPayload } from '@/hooks/use-modal';
import {
  type BulkImportResult,
  type ImportEntity,
  useBulkImport,
  useBulkImportStatus,
} from '@/services/api/requests/bulk-import';
import { StudentQueryKey } from '@/services/api/requests/students';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface EntityConfig {
  noun: string; // singular, lowercase
  title: string;
  description: string;
  template: string;
  templateFileName: string;
  listQueryKey: QueryKey;
}

const CONFIG: Record<ImportEntity, EntityConfig> = {
  student: {
    noun: 'student',
    title: 'Import Students from CSV',
    description:
      'Upload a CSV to create student accounts in bulk. Email and name are required; roll number and admission date are optional.',
    template:
      'email,firstName,lastName,rollNumber,admissionDate\n' +
      'aarav.sharma@example.com,Aarav,Sharma,STU-2026-001,2026-07-01\n' +
      'diya.patel@example.com,Diya,Patel,STU-2026-002,\n',
    templateFileName: 'students-template.csv',
    listQueryKey: [StudentQueryKey.List],
  },
  parent: {
    noun: 'parent',
    title: 'Import Parents from CSV',
    description:
      'Upload a CSV to create parent accounts in bulk. Email and name are required; emergency phone is optional.',
    template:
      'email,firstName,lastName,emergencyPhone\n' +
      'priya.menon@example.com,Priya,Menon,+91 99999 11111\n' +
      'rahul.nair@example.com,Rahul,Nair,\n',
    templateFileName: 'parents-template.csv',
    listQueryKey: ['parents'],
  },
};

// Rendered by ModalDialog when ModalType.BulkImportModal is active.
// Payload: { entity: 'student' | 'parent' }.
export function BulkImportModal() {
  const payload = useModalPayload() as { entity?: ImportEntity } | undefined;
  const entity: ImportEntity = payload?.entity ?? 'student';
  const config = CONFIG[entity];

  const hideModal = useHideModal();
  const showError = useShowApiError();
  const queryClient = useQueryClient();
  const { mutateAsync: bulkImport, isPending: isUploading } =
    useBulkImport(entity);

  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: status } = useBulkImportStatus(entity, jobId);

  useEffect(() => {
    if (!status) return;

    if (status.state === 'completed' && status.result) {
      setResult(status.result);
      setJobId(null); // stop polling
      if (status.result.created > 0) {
        void queryClient.invalidateQueries({ queryKey: config.listQueryKey });
        toast.success(
          `${status.result.created} ${config.noun}${
            status.result.created === 1 ? '' : 's'
          } imported.`,
        );
      } else {
        toast.error('No records were imported — see details below.');
      }
    } else if (status.state === 'failed') {
      setJobId(null);
      toast.error(status.error || 'Import failed. Please try again.');
    }
  }, [status, queryClient, config.listQueryKey, config.noun]);

  const isProcessing = isUploading || (!!jobId && !result);

  const downloadTemplate = () => {
    const blob = new Blob([config.template], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = config.templateFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      const { jobId: id } = await bulkImport(file);
      setJobId(id);
    } catch (error: unknown) {
      showError(error);
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setJobId(null);
    setResult(null);
    hideModal();
  };

  const startOver = () => {
    setFile(null);
    setJobId(null);
    setResult(null);
  };

  return (
    <Modal
      isOpen={true}
      onClose={resetAndClose}
      title={config.title}
      description={config.description}
      size="lg"
    >
      {result ? (
        // -------------------------------------------------------------------
        // Result summary
        // -------------------------------------------------------------------
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-sm">
              <p className="font-medium text-emerald-900 dark:text-emerald-100">
                {result.created} of {result.totalRows} row
                {result.totalRows === 1 ? '' : 's'} imported
              </p>
              {result.skipped.length > 0 && (
                <p className="text-emerald-700/80 dark:text-emerald-300/80">
                  {result.skipped.length} row
                  {result.skipped.length === 1 ? '' : 's'} skipped.
                </p>
              )}
            </div>
          </div>

          {result.skipped.length > 0 && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="border-b border-zinc-200 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 dark:border-zinc-800">
                Skipped rows
              </div>
              <div className="max-h-56 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-900">
                {result.skipped.map((skip) => (
                  <div
                    key={`${skip.row}-${skip.email ?? ''}`}
                    className="flex items-start gap-3 px-4 py-2 text-sm"
                  >
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      Line {skip.row}
                    </span>
                    <span className="shrink-0 font-medium">
                      {skip.email || '—'}
                    </span>
                    <span className="text-muted-foreground">{skip.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={startOver}>
              Import another file
            </Button>
            <Button type="button" onClick={resetAndClose}>
              Done
            </Button>
          </div>
        </div>
      ) : isProcessing ? (
        // -------------------------------------------------------------------
        // Processing (job queued / running)
        // -------------------------------------------------------------------
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm">
            <p className="font-medium">Importing {config.noun}s…</p>
            <p className="text-muted-foreground">
              {isUploading
                ? 'Uploading your file.'
                : 'Your file is being processed in the background.'}
            </p>
          </div>
          {!!status && status.progress > 0 && status.progress < 100 && (
            <div className="mt-1 h-1.5 w-56 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        // -------------------------------------------------------------------
        // Upload form
        // -------------------------------------------------------------------
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-dashed border-zinc-300 bg-muted/30 px-4 py-3 dark:border-zinc-700">
            <div className="text-sm">
              <p className="font-medium">Not sure about the format?</p>
              <p className="text-muted-foreground">
                Download a template with the required columns.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 py-10 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 dark:border-zinc-700"
            >
              <Upload className="h-6 w-6 text-muted-foreground/70" />
              <span>
                <span className="font-medium text-foreground">
                  Choose a CSV file
                </span>{' '}
                or click to browse
              </span>
            </button>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file}
              className="flex items-center gap-2"
            >
              <span>Upload &amp; Import</span>
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
