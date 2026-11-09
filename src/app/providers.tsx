'use client';
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/auth';
import { ApiError } from '@/lib/api/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Do not hammer the API on auth/permission/validation errors.
            retry: (n, e) =>
              !(e instanceof ApiError && [400, 401, 403, 404, 422, 429, 503].includes(e.status)) &&
              n < 2,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#202020',
            color: '#F7F3EA',
            border: '1px solid #38342C',
            borderRadius: '12px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
