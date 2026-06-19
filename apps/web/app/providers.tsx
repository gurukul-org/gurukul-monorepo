'use client';

import { Provider as ReduxProvider } from 'react-redux';

import ModalDialog from '@/components/ModalDialog';
import { SidepaneProvider } from '@/components/sidepanes/SidepaneProvider';
import { useBootstrapAuth } from '@/hooks/api/use-bootstrap-auth';
import { useSetupAxios } from '@/hooks/api/use-setup-axios';
import { queryClient } from '@/lib/api/query-client';
import { store } from '@/lib/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import axios from 'axios';
import { Toaster } from 'sonner';

function AxiosGate({ children }: { children: React.ReactNode }) {
  useSetupAxios(axios);
  useBootstrapAuth();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AxiosGate>
          {children}
          <ModalDialog />
          <SidepaneProvider />
        </AxiosGate>
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        )}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
