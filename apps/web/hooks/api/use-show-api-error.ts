'use client';

import { AxiosError } from 'axios';
import { toast } from 'sonner';

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

export type ApiError = AxiosError<ApiErrorBody>;

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiErrorBody | undefined;
    const fromBody = Array.isArray(data?.message)
      ? data?.message.join('. ')
      : (data?.message ?? data?.error);
    return fromBody || err.message || 'Something went wrong';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export function useShowApiError() {
  return (err: unknown) => {
    toast.error(extractMessage(err));
  };
}
