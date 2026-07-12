'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Reusable CSV bulk-import client shared by the student and parent grids.
// The backend exposes matching /students/bulk and /parents/bulk endpoints.

export type ImportEntity = 'student' | 'parent';

/** A CSV row that could not be imported, with its source line and reason. */
export interface BulkImportSkip {
  row: number;
  email: string | null;
  reason: string;
}

/** Result of a bulk CSV import. */
export interface BulkImportResult {
  totalRows: number;
  created: number;
  skipped: BulkImportSkip[];
}

/** Returned when a bulk import is queued. */
export interface BulkImportEnqueueResponse {
  jobId: string;
}

export type BulkImportState =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused'
  | 'stuck'
  | 'unknown';

/** Status of a queued bulk import job. */
export interface BulkImportStatus {
  jobId: string;
  state: BulkImportState;
  progress: number;
  result?: BulkImportResult;
  error?: string;
}

export enum BulkImportQueryKey {
  Status = 'bulk-import:status',
}

// 'student' -> '/students/bulk', 'parent' -> '/parents/bulk'
const endpoint = (entity: ImportEntity) => `/${entity}s/bulk`;

/** Uploads the CSV and queues a background import; resolves to the job id. */
export function useBulkImport(entity: ImportEntity) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post<BulkImportEnqueueResponse>(
        endpoint(entity),
        formData,
      );
      return data;
    },
  });
}

/**
 * Polls a queued import until it completes or fails. Polling stops once a
 * terminal state is reached.
 */
export function useBulkImportStatus(
  entity: ImportEntity,
  jobId: string | null,
) {
  return useQuery({
    queryKey: [BulkImportQueryKey.Status, entity, jobId],
    queryFn: async () => {
      const { data } = await axios.get<BulkImportStatus>(
        `${endpoint(entity)}/${jobId}`,
      );
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === 'completed' || state === 'failed' ? false : 1000;
    },
  });
}
