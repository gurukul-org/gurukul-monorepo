import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

const MAX_RETRIES = 2;
const STALE_TIME = 5 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      refetchOnWindowFocus: false,
      retry(failureCount, err) {
        if (err instanceof AxiosError) {
          const status = err.response?.status;
          if (status === 401 || status === 403 || status === 404) return false;
        }
        return failureCount < MAX_RETRIES;
      },
    },
    mutations: { retry: false },
  },
});
